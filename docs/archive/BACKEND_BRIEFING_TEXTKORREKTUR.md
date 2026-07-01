# Backend Briefing: Textkorrektur-Modus – Analyse & Validierung

## Übersicht

Das Frontend erhält eine neue **Weiche auf der Startseite**: Nutzer wählen zwischen
1. **Datenschutz-Analyse** (bestehend) – Texte auf sensible Daten prüfen
2. **Textkorrektur** (NEU) – Texte auf Rechtschreibung, Grammatik, Stil und Lesbarkeit prüfen

Dieses Briefing beschreibt, was das Backend dafür liefern muss.

**Ziel-Version:** 14.0.0

---

## Status Quo im Backend

### Bereits vorhanden: `POST /.netlify/functions/spell-check`

- Proxy zu **LanguageTool API** (`https://api.languagetool.org/v2/check`)
- Liefert: `corrections[]`, `correctedText`, `stats` (spelling/grammar/punctuation/style)
- Unterstützt: de-DE, en-US, fr, es, it
- **Einschränkung:** Nur LanguageTool-Basisfunktionen, kein Edit-Level, kein Style Sheet, keine Lesbarkeitsmetriken, keine AI-gestützte Textverbesserung

---

## Neue / Erweiterte API-Endpoints

### 1. POST `/api/v2/text-correct` (Erweiterung von spell-check)

Professionelle Textkorrektur mit konfigurierbarem Edit-Level nach redaktionellen Standards.

**Request:**
```json
{
  "text": "Ich glaube das du recht hast. Der Mitarbeiter: innen müssen informiert werden.",
  "language": "de-DE",
  "level": "L1",
  "config": {
    "variant": "de-DE",
    "register": "business",
    "genderOption": "G1",
    "strictness": "medium",
    "outputMode": "O2"
  }
}
```

**Edit-Levels (zentral für die Logik):**

| Level | Name | Beschreibung |
|-------|------|--------------|
| L0 | Proofread | Orthografie, Grammatik, Zeichensetzung, Typografie, grobe Konsistenz |
| L1 | Proofread+Klarheit | + Redundanzen entfernen, kleine Glättungen ohne Umstellungen |
| L2 | Line Edit | + Satzbau-Optimierung, Schachtelsätze auflösen, Übergänge verbessern |
| L3 | Copyedit | + Terminologie/Style Sheet/Cross-References, Strukturvorschläge als Option |

**Gender-Optionen:**

| Option | Beschreibung |
|--------|--------------|
| G0 | So lassen wie im Text |
| G1 | Neutralisieren (z.B. "Studierende", "Team") |
| G2 | Doppelnennung ("Mitarbeiterinnen und Mitarbeiter") |
| G3 | Wortbinnenzeichen (konsistent: ":" ODER "*" ODER "_") |

**Output-Modi:**

| Modus | Beschreibung |
|-------|--------------|
| O1 | Nur Clean Text |
| O2 | Clean + Marked Changes (empfohlen) |
| O3 | Clean + Marked Changes + Queries bei Fakten/Unklarheiten |

**Response:**
```json
{
  "success": true,
  "language": "de-DE",
  "level": "L1",
  "executiveSummary": "Geschäftstext mit 4 Korrekturen: 1 Komma-Fehler, 1 Gender-Inkonsistenz, 1 Redundanz, 1 Zeichensetzung. Grundqualität gut, Register konsistent.",
  "styleSheet": {
    "variant": "de-DE",
    "address": "Sie",
    "gender": "G1 (neutral)",
    "numbers": "ausgeschrieben bis 12, danach Ziffern",
    "quotes": "„…" / ‚…'",
    "terminology": {
      "Mitarbeiter:innen": "Beschäftigte",
      "E-Mail": "E-Mail (nicht: Email, eMail)"
    }
  },
  "originalText": "Ich glaube das du recht hast. Der Mitarbeiter: innen müssen informiert werden.",
  "correctedText": "Ich glaube, dass du recht hast. Die Beschäftigten müssen informiert werden.",
  "markedChanges": "Ich glaube~~,~~ **,** ~~das~~ **dass** du recht hast. ~~Der Mitarbeiter: innen~~ **Die Beschäftigten** müssen informiert werden.",
  "corrections": [
    {
      "offset": 11,
      "length": 3,
      "original": "das",
      "replacement": "dass",
      "category": "grammar",
      "severity": "critical",
      "rule": "Konjunktion 'dass' vs. Relativpronomen 'das'",
      "message": "Nach 'glauben' folgt ein Nebensatz mit 'dass' (Konjunktion), nicht 'das' (Artikel/Pronomen)."
    },
    {
      "offset": 10,
      "length": 0,
      "original": "",
      "replacement": ",",
      "category": "punctuation",
      "severity": "medium",
      "rule": "Komma vor Nebensatz (Pflichtkomma)",
      "message": "Vor 'dass' steht ein Pflichtkomma zur Abtrennung des Nebensatzes."
    },
    {
      "offset": 35,
      "length": 22,
      "original": "Der Mitarbeiter: innen",
      "replacement": "Die Beschäftigten",
      "category": "gender",
      "severity": "medium",
      "rule": "Gender-Option G1: Neutralisierung",
      "message": "Wortbinnenzeichen mit Leerzeichen korrigiert. Bei G1 wird geschlechtsneutral formuliert."
    }
  ],
  "stats": {
    "total": 3,
    "spelling": 0,
    "grammar": 1,
    "punctuation": 1,
    "style": 0,
    "gender": 1,
    "consistency": 0
  },
  "readability": {
    "fleschDE": 62,
    "wienerSachtextformel": 7.2,
    "cefr": "B1",
    "avgSentenceLength": 8.5,
    "avgWordLength": 5.1,
    "wordCount": 14,
    "sentenceCount": 2,
    "paragraphCount": 1
  },
  "patterns": [
    {
      "pattern": "dass/das-Verwechslung",
      "frequency": 1,
      "tip": "Probe: Kann man 'dieses/jenes/welches' einsetzen? → 'das'. Sonst → 'dass'."
    }
  ],
  "queries": [],
  "meta": {
    "processingTime": 1240,
    "provider": "languagetool+ai",
    "promptVersion": "1.0.0"
  }
}
```

---

### 2. POST `/api/v2/text-improve` (AI-gestütztes Rewriting für Stil)

Verbessert Texte nach Stilrichtung – analog zum bestehenden `/rewrite` (Datenschutz), aber für Textqualität.

**Request:**
```json
{
  "text": "Hiermit möchte ich Ihnen mitteilen, dass wir zu dem Schluss gekommen sind, dass...",
  "language": "de-DE",
  "mode": "shorter",
  "config": {
    "register": "business",
    "preserveTerminology": true
  }
}
```

**Rewrite-Modi:**

| Modus | Beschreibung |
|-------|--------------|
| `formal` | Formeller/professioneller umformulieren |
| `simple` | Einfachere Sprache (Ziel: A2/B1) |
| `shorter` | Kürzer und prägnanter |
| `professional` | Geschäftstauglich optimieren |
| `academic` | Wissenschaftlicher Stil |
| `creative` | Lebendiger, bildhafter |

**Response:**
```json
{
  "success": true,
  "mode": "shorter",
  "originalText": "Hiermit möchte ich Ihnen mitteilen, dass wir zu dem Schluss gekommen sind, dass...",
  "improvedText": "Wir haben entschieden, dass...",
  "changes": [
    {
      "type": "simplification",
      "original": "Hiermit möchte ich Ihnen mitteilen, dass wir zu dem Schluss gekommen sind",
      "replacement": "Wir haben entschieden",
      "reason": "Nominalisierung und Umständlichkeit entfernt"
    }
  ],
  "readabilityBefore": { "fleschDE": 38, "cefr": "C1" },
  "readabilityAfter": { "fleschDE": 71, "cefr": "B1" },
  "wordCountBefore": 16,
  "wordCountAfter": 5,
  "meta": {
    "processingTime": 890
  }
}
```

---

### 3. POST `/api/v2/readability` (Lesbarkeitsanalyse)

Eigenständiger Endpoint für reine Lesbarkeitsmetriken ohne Korrektur.

**Request:**
```json
{
  "text": "Der Text, dessen Lesbarkeit analysiert werden soll...",
  "language": "de-DE"
}
```

**Response:**
```json
{
  "success": true,
  "language": "de-DE",
  "scores": {
    "fleschDE": 55,
    "fleschLabel": "Mittlere Schwierigkeit",
    "wienerSachtextformel": 8.3,
    "cefr": "B2",
    "cefrLabel": "Fortgeschritten"
  },
  "statistics": {
    "characters": 312,
    "words": 52,
    "sentences": 4,
    "paragraphs": 1,
    "avgWordLength": 5.8,
    "avgSentenceLength": 13.0,
    "longestSentence": { "length": 22, "text": "..." },
    "shortestSentence": { "length": 5, "text": "..." }
  },
  "distribution": {
    "shortSentences": 2,
    "mediumSentences": 1,
    "longSentences": 1,
    "veryLongSentences": 0
  },
  "suggestions": [
    "1 Satz hat mehr als 20 Wörter – ggf. aufteilen für bessere Lesbarkeit.",
    "Durchschnittliche Wortlänge ist leicht erhöht – prüfe, ob Fachbegriffe vereinfacht werden können."
  ]
}
```

---

## Normbasis für den AI-Prompt im Backend

Das Backend muss den AI-Prompt (für GPT/Claude) nach folgender Normbasis konfigurieren:

### Primär: Amtliches Regelwerk der deutschen Rechtschreibung (Fassung 2024)
- Quelle: IDS/grammis (https://grammis.ids-mannheim.de/rechtschreibung)
- Verbindlich seit 01.07.2024

### Sekundär: Duden
- Als praxisnahe Darstellung/Empfehlung bei Zweifelsfällen
- Übersteuert NICHT die amtliche Norm

### Varianten-Handling
- `de-DE`: Standard, ß/ss nach Regelwerk, „…" Anführungszeichen
- `de-AT`: Wie de-DE, regionale Begriffe respektieren
- `de-CH`: Kein ß (immer ss), optional «…» Anführungszeichen

### Deutsch-spezifische Pflichtchecks im Prompt

| Check | Beschreibung |
|-------|--------------|
| A: Orthografie | ß/ss/ẞ, Fremdwörter, Worttrennung |
| B: Groß-/Kleinschreibung | Satzanfänge, Substantivierungen, Namen, Anrede |
| C: Getrennt-/Zusammenschreibung | Komposita, Wortgruppe vs. Zusammensetzung |
| D: Bindestrich/Gedankenstrich | Pflichtfälle (Ziffern/Abk.), Lesbarkeit |
| E: Zeichensetzung (Komma-System) | Nebensätze, Infinitivgruppen, Zusätze, paarige Kommas |
| F: Anführungszeichen | „…"/‚…', Trägersatz-Regeln, verschachtelte Zitate |
| G: Genderzeichen | Nach konfigurierter Option (G0-G3), konsistent |
| H: Konsistenz | Terminologie, Zahlen, Daten, Cross-References |

---

## Referenz-Prompt für das Backend (DE)

Der folgende Prompt soll im Backend als System-Prompt für die AI-gestützte Korrektur verwendet werden:

```
ROLLE
Du bist Senior Editor (20+ Jahre) für Deutsch. Du arbeitest präzise, normorientiert, nachvollziehbar.
Du bewahrst Sinn, Logik und Stimme. Du erfindest keine Fakten und ergänzt keine Inhalte,
außer minimal zur Grammatik/Kohäsion, wenn zwingend nötig.

SCOPE (EDIT-LEVEL)
Wähle anhand der Konfiguration den Leistungsumfang:
L0 PROOFREAD: Orthografie, Grammatik, Zeichensetzung, Typografie, grobe Konsistenz.
L1 PROOFREAD+KLARHEIT: + Redundanzen, kleine Glättungen ohne Umstellungen.
L2 LINE EDIT: + Satzbau-Optimierung, Schachtelsätze auflösen, Übergänge (minimal-invasiv).
L3 COPYEDIT: + Terminologie/Style Sheet/Cross-References; Strukturvorschläge NUR als OPTION.

KONFIGURATION
- Sprachvariante: {variant} (de-DE | de-AT | de-CH)
- Register: {register} (business | wissenschaft | behördlich | marketing | kreativ | neutral)
- Gender-Option: {genderOption} (G0 | G1 | G2 | G3)
- Änderungsmodus: {outputMode} (O1 | O2 | O3)
- Strenge: {strictness} (low | medium | high)

NORMBASIS
- Primär: Amtliches Regelwerk der deutschen Rechtschreibung (Fassung 2024).
- Sekundär: Duden bei Zweifelsfällen.
- de-CH: kein ß, verwende ss.

NICHT VERHANDELBAR
1) Keine neuen Fakten. Keine stillen Inhaltsänderungen.
2) Unklare/falsche Fakten: als Query markieren, nicht "korrigieren".
3) Einmal entschiedene Varianten konsequent durchziehen (Style Sheet).
4) Keine Regression: keine neuen Fehler einführen.

DEUTSCH-SPEZIFISCHE CHECKS
A: ß/ss/ẞ korrekt gemäß Variante; Fremdwörter konsistent.
B: Groß-/Kleinschreibung (Substantivierungen, Überschriften, Anrede).
C: Getrennt-/Zusammenschreibung & Komposita nach Bedeutung.
D: Bindestrich (Pflichtfälle mit Ziffern/Abk.) / Gedankenstrich korrekt.
E: Komma-System (Nebensätze, Infinitivgruppen, Zusätze, paarige Kommas).
F: Anführungszeichen „…" / ‚…' (de-CH: «…»/‹…›), Trägersatz-Regeln.
G: Genderzeichen gemäß Option, konsistent, ohne Leerzeichen im Wortinneren.
H: Konsistenz (Terminologie, Zahlen/Daten, Cross-References).

ARBEITSABLAUF
1) Vollständiges Lesen: Zweck, Ton, Zielgruppe.
2) Mini-Style Sheet erzeugen (Variante, Anrede, Gender, Zahlen/Daten, Terminologie).
3) Edit gemäß Level.
4) Konsistenz-Pass gegen Style Sheet.
5) Final QA: Sinn unverändert? Keine neuen Fakten? Keine neuen Fehler?

OUTPUT (als JSON)
- executiveSummary: 3-6 Sätze zu Zweck, Register, Level, Hauptbaustellen
- styleSheet: Entscheidungen + Glossar
- corrections: Array mit {offset, length, original, replacement, category, severity, rule, message}
- correctedText: vollständige überarbeitete Fassung
- markedChanges: ~~alt~~ **neu** Format (wenn O2/O3)
- queries: nummerierte Rückfragen (wenn O3)
- patterns: 2-4 wiederkehrende Fehler + Lernhinweise
```

---

## Universelles Template (Mehrsprachig, Zukunft)

Für den späteren Ausbau auf weitere Sprachen soll das Backend ein **Language-Plugin-System** unterstützen:

```
[CONFIG]
LANGUAGE: {LANG} (z.B. de-DE, en-GB, fr-FR, es-ES, it-IT)
LEVEL: {L0|L1|L2|L3}
REGISTER: {formal|neutral|casual|scientific|marketing|literary}
STRICTNESS: {low|medium|high}
OUTPUT_MODE: {O1|O2|O3}

[ROLE]
Senior editor (20+ years). Preserve meaning and voice.
Never invent facts; uncertain points become queries.

[PROCESS]
1) Read fully (purpose, tone, audience).
2) Build mini style sheet.
3) Detect & classify issues.
4) Edit according to level + register. Minimal invasiveness.
5) Consistency pass against style sheet.
6) Final QA: no meaning shift, no new facts, no new errors.

[LANGUAGE PLUGIN: {LANG}]
→ Insert language-specific rules (orthography, punctuation, capitalization, quotation marks, compounding, grammar hotspots, inclusive language).

[OUTPUT]
A) Executive summary
B) Style sheet
C) Corrections array (category, location, fix, severity)
D) Revised text (clean)
E) Marked changes (optional)
F) Queries (optional)
G) Pattern feedback
```

---

## Backend-Validierung: Checkliste

### Bestehende Endpoints prüfen

- [ ] `POST /spell-check` – Funktioniert LanguageTool-Proxy korrekt?
- [ ] `POST /rewrite` – Rewrite-Logik und AI-Prompt prüfen
- [ ] `GET /health` – Gibt korrekten Status zurück?
- [ ] Alle 44 Netlify Functions – Proxy-Pattern konsistent?

### Architektur prüfen

- [ ] Railway Backend erreichbar und stabil?
- [ ] API v2 Routing korrekt (`/api/v2/...`)?
- [ ] CORS-Headers korrekt für alle Origins?
- [ ] Rate Limiting konfiguriert?
- [ ] Error Handling konsistent (gleiche Response-Struktur bei Fehlern)?

### Sicherheit prüfen

- [ ] Keine API-Keys im Frontend exponiert?
- [ ] Input-Validierung auf allen Endpoints?
- [ ] Text-Länge-Limits gesetzt?
- [ ] IP-Masking in Logs aktiv?
- [ ] Keine Speicherung von Nutzertexten?

### Für die neuen Endpoints implementieren

- [ ] `POST /api/v2/text-correct` – LanguageTool + AI-Prompt (Level L0-L3)
- [ ] `POST /api/v2/text-improve` – AI-Rewrite für Stil (6 Modi)
- [ ] `POST /api/v2/readability` – Lesbarkeitsmetriken (Flesch-DE, Wiener Sachtextformel, CEFR)
- [ ] Netlify Proxy-Functions für alle 3 neuen Endpoints
- [ ] Prompt-Versionierung im Backend (SemVer)
- [ ] Testset: 250-400 kuratierte deutsche Testfälle
- [ ] Regression-Suite: New-Error-Rate < 0.1%

### Metriken & QA

- [ ] Precision/Recall/F1 je Kategorie (spelling, grammar, punctuation, style, gender, consistency)
- [ ] Weighted F1 nach Schweregrad (kritisch=3, mittel=2, klein=1)
- [ ] New-Error-Rate pro 1.000 Wörter
- [ ] Processing Time < 3s für Texte bis 2.000 Zeichen

---

## Prioritäten

| Priorität | Endpoint | Aufwand |
|-----------|----------|---------|
| **P0 (sofort)** | `text-correct` mit L0+L1 | 5-8 PT |
| **P1 (bald)** | `readability` | 2-3 PT |
| **P2 (danach)** | `text-correct` mit L2+L3 | 5-8 PT |
| **P3 (später)** | `text-improve` (6 Modi) | 5-8 PT |
| **P4 (Zukunft)** | Multilinguale Language-Plugins | je Sprache 16-38 PT |

---

## Review-Ergänzungen (Code-Analyse)

Die folgenden 5 Punkte ergeben sich aus der Analyse des bestehenden Codes und ergänzen das Briefing um praxisrelevante Details.

### A) LanguageTool Free API Limits

**Problem:** Das Briefing erwähnt nicht, dass die LanguageTool Free API strikte Rate-Limits hat:
- ~20 Requests/Minute
- ~40 KB pro Request
- Keine Garantie für Verfügbarkeit

**Auswirkung auf L0:** `text-correct` mit L0 nutzt LanguageTool als Basis. Bei mehreren gleichzeitigen Nutzern werden die Limits schnell erreicht.

**Empfehlung:**
- **Kurzfristig:** LanguageTool Premium API-Key beschaffen (~19€/Monat für 100.000 Requests)
- **Mittelfristig:** Self-Hosted LanguageTool-Instanz auf Railway (Docker-Image verfügbar: `erikvl87/languagetool`)
- **Fallback:** Bei Rate-Limit-Fehler (HTTP 429) → nur AI-gestützte Korrektur ohne LanguageTool-Vorlauf

### B) text-correct Routing: Hybridansatz

**Problem:** Das Briefing definiert `/api/v2/text-correct` als Railway-Endpoint. Aber für L0 (rein LanguageTool) könnte die Netlify Function das direkt erledigen – wie `spell-check.js` es heute schon tut.

**Empfehlung – Hybridansatz:**

```
L0 (Proofread):
  → Netlify Function "text-correct.js"
  → Ruft LanguageTool API direkt auf
  → Berechnet Readability lokal (Formeln)
  → Kein Railway-Roundtrip nötig
  → Latenz: ~500ms statt ~1500ms

L1-L3 (AI-gestützt):
  → Netlify Function "text-correct.js"
  → Ruft zuerst LanguageTool (Voranalyse)
  → Leitet LanguageTool-Ergebnis + Text an Railway weiter
  → Railway führt AI-Prompt aus
  → Latenz: ~1500-3000ms
```

**Vorteil:** L0 ist sofort schneller und kostengünstiger. Railway wird nur bei AI-Bedarf belastet.

### C) Readability: Lokale Berechnung statt Backend-Roundtrip

**Problem:** Flesch-DE und Wiener Sachtextformel sind reine mathematische Formeln (Silben/Wörter/Sätze zählen). Ein Railway-Roundtrip ist dafür unnötig.

**Flesch-DE Formel:**
```
FRE_DE = 180 - (avgSentenceLength) - (58.5 × avgSyllablesPerWord)
```

**Wiener Sachtextformel (1. Variante):**
```
WSTF = 0.1935 × MS + 0.1672 × SL + 0.1297 × IW - 0.0327 × ES - 0.875
(MS = % Wörter ≥3 Silben, SL = avg Satzlänge, IW = % Wörter ≥6 Buchstaben, ES = % einsilbige Wörter)
```

**Empfehlung:**
- **Option 1:** Readability als Netlify Function (kein Railway) → Latenz ~100ms
- **Option 2:** Readability als Client-seitige Berechnung im Frontend → Latenz ~10ms
- **Option 3:** Readability im `text-correct` Response einbetten (wie im Briefing definiert) → kein separater Endpoint nötig

Option 3 ist empfohlen: Der `/api/v2/readability`-Endpoint bleibt als eigenständige Netlify Function für Fälle, wo nur die Lesbarkeit geprüft werden soll (ohne Korrektur). Aber die Berechnung selbst erfolgt lokal in der Function, nicht via Railway.

### D) Bestehende Sicherheitslücken adressieren

**Problem:** Die Code-Analyse hat folgende Schwachstellen im bestehenden Setup aufgedeckt, die bei den neuen Endpoints von Anfang an vermieden werden müssen:

| Schwachstelle | Besteht in | Maßnahme für neue Endpoints |
|---|---|---|
| **Kein Rate-Limiting** | `spell-check.js` | Rate-Limit pro IP: 30 Req/Min für `text-correct`, 10 Req/Min für `text-improve` |
| **CORS `*`** | Alle Netlify Functions | Explizite Origin-Whitelist: `achtung.live`, `*.achtung.live`, `localhost:*` |
| **Kein Input-Length-Limit** | `spell-check.js` | Max 10.000 Zeichen für `text-correct`, 5.000 für `text-improve` |
| **`script.js` umgeht Proxy** | Frontend direkt → LanguageTool | Neue Endpoints NUR über Proxy, keine direkten API-Calls im Frontend |
| **Keine Fehler-Normalisierung** | Verschiedene Error-Formate | Einheitliches Error-Response-Format für alle v2-Endpoints |

**Einheitliches Error-Response-Format:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Zu viele Anfragen. Bitte warte 30 Sekunden.",
    "retryAfter": 30
  }
}
```

### E) Aufwand-Korrektur P0

**Problem:** Die Schätzung P0 = 5-8 PT für `text-correct` mit L0+L1 zusammen ist etwas grob.

**Differenzierte Schätzung:**

| Teilaufgabe | Aufwand | Begründung |
|---|---|---|
| L0 (LanguageTool + Readability-Formeln) | 2-3 PT | Bestehender `spell-check.js` als Vorlage, Readability sind reine Formeln |
| L1 (AI-Prompt-Integration) | 3-4 PT | Prompt-Engineering, Railway-Endpoint, Response-Mapping, Testfälle |
| Netlify Proxy Function | 0.5 PT | Analog zu bestehenden Functions |
| Error Handling + Rate Limiting | 1 PT | Einheitliches Format, IP-basiertes Limiting |
| **Gesamt L0+L1** | **6.5-8.5 PT** | Passt zum oberen Bereich der Schätzung |

**Empfehlung:** L0 und L1 als separate Sprints umsetzen:
- **Sprint 1 (2-3 PT):** L0 live bringen → sofortiger Nutzen, kein AI-Kosten
- **Sprint 2 (4-5.5 PT):** L1 nachrüsten → AI-Erweiterung mit höherem Aufwand

---

## Zusammenfassung

Das Frontend baut eine Weiche ein, die Nutzer zwischen **Datenschutz-Analyse** und **Textkorrektur** wählen lässt. Das Backend muss:

1. Den bestehenden `/spell-check` als Basis behalten (LanguageTool für L0)
2. Einen neuen `/api/v2/text-correct` Endpoint bauen, der LanguageTool + AI-Prompt kombiniert
3. Den DE-Referenz-Prompt (oben) als System-Prompt implementieren
4. Lesbarkeitsmetriken berechnen (Flesch-DE, Wiener Sachtextformel)
5. Später: AI-Rewrite für Stil (`text-improve`) und mehrsprachige Plugins

### Ergänzte Empfehlungen aus der Code-Analyse:

6. **LanguageTool Premium** oder Self-Hosted einplanen (Free API zu limitiert für Produktion)
7. **Hybridansatz** beim Routing: L0 direkt in Netlify, L1+ über Railway
8. **Readability lokal** berechnen (Netlify Function oder Client-seitig), nicht via Railway
9. **Sicherheit** von Anfang an: Rate-Limiting, CORS-Whitelist, Input-Limits, einheitliche Fehler
10. **L0 und L1 getrennt** ausrollen für schnelleren ersten Nutzen
