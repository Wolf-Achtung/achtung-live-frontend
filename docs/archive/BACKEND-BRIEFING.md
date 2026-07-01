# Backend-Analyse-Briefing: achtung.live

> **Datum:** 2026-04-03
> **Zweck:** Vollständige Analyse der Backend-Architektur als Grundlage für Korrekturen und Optimierungen
> **Scope:** Netlify Functions (Frontend-Proxy-Layer) + Railway-Backend-Anbindung

---

## 1. Architektur-Überblick

```
Browser (Frontend: index.html / script.js)
    │
    ├─── Netlify Functions (44 Serverless-Proxies)
    │        │                          │
    │        ▼                          ▼
    │    Railway Backend               Externe APIs
    │    (achtung-live-backend-        ├─ LanguageTool API (spell-check)
    │     production.up.railway.app)   └─ OpenAI Moderation API
    │
    └─── Direkte Backend-Aufrufe (script.js)
         → https://achtung-live-backend-production.up.railway.app
           ├─ /analyze
           ├─ /rewrite
           └─ /howto
```

### Zwei-Tier-Proxy-Architektur

| Typ | Anzahl | Beschreibung |
|-----|--------|-------------|
| CORS-Proxies zum Railway-Backend | 38 | Leiten Requests an `/api/v2/*` weiter |
| Eigene Logik (kein Backend nötig) | 3 | `spell-check.js`, `content-moderation.js`, `ping.js` |
| Admin-Functions (In-Memory) | 3 | `admin-logs.js`, `admin-stats.js`, `admin-settings.js` |

### Konfiguration (netlify.toml)

- **Publish:** Root (`.`)
- **Functions:** `netlify/functions/`
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Cache:** `public, max-age=3600`
- **Processing:** Pretty URLs, Bild-Kompression, kein CSS/JS-Bundling

---

## 2. Vollständige Endpoint-Übersicht

### 2.1 Kern-Datenschutz (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| `analyze.js` | `/api/v2/analyze` (Fallback: `/analyze`) | POST | Datenschutz-Risikoanalyse |
| `rewrite.js` | `/api/v2/rewrite` | POST | Smart-Rewrite (anonymize/redact/pseudonymize) |
| `analyze-batch.js` | `/api/v2/analyze/batch` | POST | Batch-Analyse (max 20 Texte) |
| `analyze-predictive.js` | `/api/v2/analyze/predictive` | POST | Zukunfts-Risiko, Deanonymisierung |
| `patterns-offline.js` | - | GET | Offline-Muster für Client-Fallback |

**Analyze Request/Response:**
```json
// Request
{ "text": "...", "context": "private|work|social", "options": { "includeRewrite": true, "quickCheck": false } }

// Response
{ "success": true, "riskScore": 75, "riskLevel": "warning",
  "categories": [{ "type": "...", "severity": "high", "description": "...", "examples": [], "recommendations": [] }],
  "summary": "...", "rewrite": {}, "meta": { "processingTime": 120, "cached": false } }
```

**Rewrite Request/Response:**
```json
// Request
{ "text": "...", "mode": "anonymize|redact|pseudonymize", "categories": [], "preserveFormat": true }

// Response
{ "success": true, "rewritten": "...", "changes": [{ "original": "...", "replacement": "..." }], "mode": "anonymize" }
```

### 2.2 Spell-Check (→ LanguageTool API direkt)

| Netlify Function | Externe API | Methode | Zweck |
|-----------------|-------------|---------|-------|
| `spell-check.js` | `api.languagetool.org/v2/check` | POST | Rechtschreibung, Grammatik, Zeichensetzung, Stil |

**Wichtig:** Geht NICHT über Railway-Backend, sondern direkt zu LanguageTool.

**Request/Response:**
```json
// Request
{ "text": "...", "language": "de" }

// Response
{ "success": true, "language": "de-DE", "originalText": "...", "correctedText": "...",
  "corrections": [{ "offset": 5, "length": 4, "message": "...", "shortMessage": "...",
    "replacements": ["..."], "rule": { "id": "...", "category": "...", "type": "spelling|grammar|punctuation|style" },
    "context": { "text": "...", "offset": 5, "length": 4 } }],
  "stats": { "total": 3, "spelling": 1, "grammar": 1, "punctuation": 0, "style": 1 },
  "hasErrors": true }
```

**Sprach-Mapping:**
| Frontend | LanguageTool |
|----------|-------------|
| `de` | `de-DE` |
| `en` | `en-US` |
| `fr` | `fr` |
| `es` | `es` |
| `it` | `it` |

**Kategorisierung (getCorrectionType):**
| LanguageTool-Kategorie | Interner Typ |
|----------------------|-------------|
| TYPOS, SPELLING, CASING, COMPOUNDING | `spelling` |
| GRAMMAR, CONFUSED_WORDS | `grammar` |
| PUNCTUATION, TYPOGRAPHY | `punctuation` |
| STYLE, REDUNDANCY, COLLOQUIALISMS | `style` |

### 2.3 Dokument/OCR (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| *(implizit via Frontend)* | `/api/v2/analyze-document` | POST (FormData) | OCR + Dokumentanalyse |

**Limits:** Bilder max 10 MB, PDFs max 25 MB

### 2.4 Digital Footprint Scanner (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| `footprint-scan.js` | `/api/v2/footprint/scan` | POST | Footprint-Scan |
| `footprint-breach-check.js` | `/api/v2/footprint/breach-check` | POST | Breach-Check |

### 2.5 Smart Privacy Coach (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| `coach-chat.js` | `/api/v2/coach/chat` | POST | AI-Chat |
| `coach-topics.js` | `/api/v2/coach/topics` | GET | Themen-Liste |
| `coach-topic-detail.js` | `/api/v2/coach/topic/{topicId}` | GET | Themen-Details |
| `coach-quick-tips.js` | `/api/v2/coach/quick-tips` | GET | Tägliche Tipps |
| `coach-feedback.js` | `/api/v2/coach/feedback` | POST | Feedback |

### 2.6 Privacy Policy Analyzer (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| `policy-analyze.js` | `/api/v2/policy/analyze` | POST | Policy-Analyse (Text/URL) |
| `policy-compare.js` | `/api/v2/policy/compare` | POST | Policy-Vergleich |
| `policy-known.js` | `/api/v2/policy/known` | GET | Bekannte Services |
| `policy-services.js` | `/api/v2/policy/services` | GET | Service-Liste |

### 2.7 Data Breach Alerts (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| `alerts-subscribe.js` | `/api/v2/alerts/subscribe` | POST | Abo-Anmeldung |
| `alerts-verify.js` | `/api/v2/alerts/verify` | POST | E-Mail-Verifizierung |
| `alerts-unsubscribe.js` | `/api/v2/alerts/unsubscribe` | POST | Abmeldung |
| `alerts-status.js` | `/api/v2/alerts/status` | GET | Abo-Status |
| `alerts-preferences.js` | `/api/v2/alerts/preferences` | GET/POST | Einstellungen |
| `alerts-history.js` | `/api/v2/alerts/history` | GET | Verlauf |
| `alerts-recent.js` | `/api/v2/alerts/recent` | GET | Aktuelle Breaches |

### 2.8 Privacy Templates (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| `templates-analyze.js` | `/api/v2/templates/analyze` | POST | Text-Analyse |
| `templates-categories.js` | `/api/v2/templates/categories` | GET | Kategorien |
| `templates-list.js` | `/api/v2/templates/list` | GET | Templates pro Kategorie |
| `templates-detail.js` | `/api/v2/templates/detail` | GET | Template-Details |
| `templates-search.js` | `/api/v2/templates/search` | GET | Suche |
| `templates-customize.js` | `/api/v2/templates/customize` | POST | Anpassung |
| `templates-favorites.js` | `/api/v2/templates/favorites` | POST | Favoriten |
| `templates-gdpr.js` | `/api/v2/templates/gdpr` | GET | DSGVO-Vorlagen |

### 2.9 Browser Extension (→ Railway-Backend)

| Netlify Function | Backend-Endpoint | Methode | Zweck |
|-----------------|------------------|---------|-------|
| `extension-analyze-field.js` | `/api/v2/extension/analyze-field` | POST | Feld-Analyse |
| `extension-analyze-form.js` | `/api/v2/extension/analyze-form` | POST | Formular-Analyse |
| `extension-analyze-cookies.js` | `/api/v2/extension/analyze-cookies` | POST | Cookie-Analyse |
| `extension-dark-patterns.js` | `/api/v2/extension/dark-patterns` | POST | Dark-Pattern-DB |
| `extension-detect-dark-patterns.js` | `/api/v2/extension/detect-dark-patterns` | POST | Dark-Pattern-Erkennung |
| `extension-tracker-database.js` | `/api/v2/extension/tracker-database` | GET | Tracker-Datenbank (mit Fallback) |

### 2.10 Content Moderation & Admin (Lokale Logik)

| Netlify Function | Methode | Zweck |
|-----------------|---------|-------|
| `content-moderation.js` | POST | Rate-Limiting + Blacklist + OpenAI-Moderation |
| `admin-logs.js` | GET/POST | Aktivitäts-/Moderations-Logs (In-Memory) |
| `admin-stats.js` | GET | Statistiken |
| `admin-settings.js` | GET/POST | Einstellungen |

### 2.11 Health & Status

| Netlify Function | Methode | Zweck |
|-----------------|---------|-------|
| `health.js` | GET | Backend-Status + Provider-Check (→ Railway) |
| `ping.js` | GET | Lokaler Konnektivitätstest |

---

## 3. Content-Moderation im Detail

**`content-moderation.js`** (342 Zeilen) - Einzige Function mit umfassender eigener Logik:

### Rate-Limiting
- **Per-Minute:** 30 Requests (konfigurierbar)
- **Per-Tag:** 500 Requests (konfigurierbar)
- **Speicherung:** In-Memory `Map()` - geht bei Cold-Start verloren
- **Response:** HTTP 429 mit `Retry-After` Header

### Blacklist
- 28 deutsche Begriffe (Gewalt, Hassrede, Expliziter Content, Betrug)
- Case-insensitive String-Matching

### AI-Moderation
- OpenAI Moderation API (`api.openai.com/v1/moderations`)
- Threshold: 0.7 (konfigurierbar)
- Benötigt `OPENAI_API_KEY` in Netlify Environment
- Graceful Fallback wenn Key fehlt

### Logging
- Activity-Logs: max 1000 Einträge (In-Memory)
- Moderation-Logs: max 500 Einträge (In-Memory)
- IP-Maskierung (letztes Oktett redacted)
- **NICHT persistent** - Verlust bei jedem Deploy/Cold-Start

---

## 4. Externe API-Integrationen

| API | Genutzt von | Auth | Kosten |
|-----|------------|------|--------|
| LanguageTool | `spell-check.js` | Keine (Free API) | Kostenlos |
| OpenAI Moderation | `content-moderation.js` | Bearer Token (`OPENAI_API_KEY`) | Minimal |
| Railway Backend | 38 Proxy-Functions | Keine | Railway-Plan |

### Environment Variables
| Variable | Genutzt in | Pflicht |
|----------|-----------|---------|
| `OPENAI_API_KEY` | `content-moderation.js` | Nein (Fallback vorhanden) |

---

## 5. Sicherheits-Analyse

### Stärken
- ✅ CORS-Headers konsistent auf allen Functions
- ✅ X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- ✅ IP-Maskierung im Logging
- ✅ Content-Moderation mit Blacklist + AI
- ✅ Input-Validierung (leere Texte, ungültiges JSON)
- ✅ Keine Secrets im Code

### Schwächen / Risiken
- ⚠️ **Kein API-Key-Schutz** auf Netlify-Functions - jeder kann sie aufrufen
- ⚠️ **Rate-Limiting nur auf `/content-moderation`** - `/analyze`, `/spell-check` etc. ungeschützt
- ⚠️ **In-Memory-Storage** für Logs und Rate-Limits - nicht persistent, geht bei Cold-Start verloren
- ⚠️ **`script.js` umgeht Netlify-Proxy** - ruft Railway-Backend direkt auf (CORS-Risiko, kein Rate-Limiting)
- ⚠️ **CORS `*`** auf allen Functions - kein Origin-Filtering
- ⚠️ **Kein Request-Size-Limit** auf den meisten Functions (nur Batch: max 20 Texte)

---

## 6. Fallback-Strategie

Viele Features haben Client-Side-Fallbacks bei Backend-Ausfall:

| Feature | Fallback-Funktion | Qualität |
|---------|------------------|----------|
| Predictive Privacy | `performClientSidePredictiveAnalysis()` | Gut (Regex-basiert) |
| Footprint Scanner | `performClientSideFootprintScan()` | Simuliert |
| Policy Analyzer | `performClientSidePolicyAnalysis()` | Basis-Erkennung |
| Coach Chat | `generateClientSideResponse()` | Keyword-Matching |
| Coach Tips | Eingebaute Tipps + Challenges | 5 Tipps, 7 Challenges |
| Tracker DB | 20+ eingebaute Tracker | Umfangreich |
| Templates-Analyze | Lokale PII-Regex | 9 Muster |
| Health Check | Degraded/Unhealthy Status | Status-Anzeige |

---

## 7. Datenfluss: Frontend → Backend

### Über Netlify Functions (Standard-Weg)
```
index.html  →  /.netlify/functions/*  →  Railway /api/v2/*
                                      →  LanguageTool API
                                      →  OpenAI API
```

### Direkte Aufrufe (script.js - Legacy)
```
script.js  →  https://achtung-live-backend-production.up.railway.app/analyze
           →  https://achtung-live-backend-production.up.railway.app/rewrite
           →  https://achtung-live-backend-production.up.railway.app/howto
```

### Browser Extension
```
extension/background.js  →  https://achtung.live/.netlify/functions/*
                         →  Client-Side Fallback (Regex)
```

---

## 8. Gap-Analyse: Was für den Textkorrektur-Modus fehlt

### Bereits vorhanden und nutzbar

| Fähigkeit | Quelle | Status |
|-----------|--------|--------|
| Rechtschreibprüfung | `spell-check.js` → LanguageTool | ✅ Funktional |
| Grammatikprüfung | `spell-check.js` → LanguageTool | ✅ Funktional |
| Zeichensetzung | `spell-check.js` → LanguageTool | ✅ Funktional |
| Stil-Hinweise | `spell-check.js` → LanguageTool | ✅ Funktional |
| 5-Sprachen-Support | LanguageTool Mapping | ✅ Vollständig |
| AI-Text-Rewrite | `rewrite.js` → Railway | ✅ Nur Datenschutz-Modi |

### Muss NEU gebaut werden

#### A) Readability-Score (Netlify Function - KEIN Backend nötig)
```
POST /.netlify/functions/readability
Request:  { "text": "...", "language": "de" }
Response: {
  "fleschIndex": 62,
  "fleschLevel": "mittel",
  "wienerSachtextformel": 8.2,
  "sprachniveau": "B1",
  "stats": {
    "woerter": 150,
    "saetze": 12,
    "absaetze": 3,
    "durchschnittlicheSatzlaenge": 12.5,
    "passivKonstruktionen": 3,
    "passivAnteil": 0.25
  },
  "ton": "formell"
}
```
**Aufwand:** Gering - reine Textstatistik, lokal berechenbar

#### B) Erweiterter Text-Correct (Netlify Function - kombiniert bestehende APIs)
```
POST /.netlify/functions/text-correct
Request:  { "text": "...", "language": "de", "includeReadability": true }
Response: {
  "corrections": [...],        // von LanguageTool
  "correctedText": "...",      // von LanguageTool
  "stats": {...},              // von LanguageTool
  "readability": {...},        // lokal berechnet
  "textStats": {...}           // lokal berechnet
}
```
**Aufwand:** Mittel - kombiniert spell-check + readability in einem Call

#### C) Stil-Rewrite (Netlify Function → Railway-Backend)
```
POST /.netlify/functions/text-improve
Request:  { "text": "...", "mode": "formeller|einfacher|kuerzer|professioneller", "language": "de" }
Response: { "improved": "...", "changes": [...], "mode": "formeller" }
```
**Aufwand:** Mittel - benötigt neuen Railway-Endpoint `/api/v2/text-improve`

---

## 9. Empfohlene Umsetzungsreihenfolge

| Schritt | Was | Backend-Abhängigkeit | Aufwand |
|---------|-----|---------------------|---------|
| 1 | Weiche auf `index.html` (Datenschutz / Textkorrektur) | Keine | Gering |
| 2 | Textkorrektur-UI mit bestehendem `/spell-check` | Keine | Mittel |
| 3 | `readability` Netlify Function | Keine | Gering |
| 4 | `text-correct` kombinierte Function | Keine | Mittel |
| 5 | `text-improve` Function + Railway-Endpoint | Railway-Backend | Mittel |

**Schritt 1-4 können OHNE Backend-Änderung umgesetzt werden.**
**Nur Schritt 5 erfordert einen neuen Endpoint im Railway-Backend.**

---

## 10. Bekannte Probleme & Optimierungspotenzial

### Kritisch
1. **In-Memory-Storage** in content-moderation.js / admin-logs.js → Sollte durch persistenten Storage ersetzt werden (Redis, DB, oder Netlify Blobs)
2. **script.js umgeht Proxy** → Direkte Backend-Aufrufe sollten auf Netlify Functions migriert werden
3. **Kein Rate-Limiting** auf analyse-relevanten Endpoints

### Wichtig
4. **CORS `*`** → Sollte auf `achtung.live` eingeschränkt werden
5. **Keine API-Key-Validierung** → Mindestens ein einfacher API-Key für externe Aufrufe
6. **Kein Request-Size-Limit** → Könnte für DoS ausgenutzt werden
7. **LanguageTool Free API** → Hat Rate-Limits (nicht dokumentiert im Code, kein Error-Handling dafür)

### Nice-to-have
8. **Einheitliche Error-Response-Formate** → Manche Functions nutzen `error`, andere `message`
9. **Logging-Standardisierung** → Manche loggen `console.log`, andere `console.error`
10. **Health-Check erweitern** → LanguageTool-Erreichbarkeit prüfen
11. **Duplicate Functions** → `extension-dark-patterns.js` und `extension-detect-dark-patterns.js` scheinen redundant
