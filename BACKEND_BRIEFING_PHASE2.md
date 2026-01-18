# Backend Briefing: Phase 2 - achtung.live

**Datum:** 2026-01-18
**Status:** Ready for Implementation
**Frontend Branch:** `claude/analyze-website-validation-e4VP9`

---

## Übersicht Phase 2 Features

| Feature | Priorität | Komplexität |
|---------|-----------|-------------|
| Smart Rewrite (vollständig) | Hoch | Mittel |
| Batch-Analyse | Hoch | Mittel |
| Erweiterte Kategorien | Mittel | Niedrig |
| Provider-Fallback (OpenAI ↔ Anthropic) | Mittel | Niedrig |

---

## 1. Smart Rewrite - Vollständig funktional

### Aktueller Stand (Phase 1)
- Frontend zeigt Platzhalter für Rewrite-Vorschläge
- API v2 liefert `repistewriteSuggestions` Array (teilweise implementiert)

### Anforderungen Phase 2

#### 1.1 Neuer Endpoint: POST `/api/v2/rewrite`

```typescript
// Request
interface RewriteRequest {
  text: string;
  mode: 'anonymize' | 'redact' | 'pseudonymize';
  categories?: string[];  // Optional: nur bestimmte Kategorien bearbeiten
  preserveFormat?: boolean;  // Formatierung beibehalten
}

// Response
interface RewriteResponse {
  success: boolean;
  original: string;
  rewritten: string;
  changes: RewriteChange[];
  stats: {
    totalChanges: number;
    byCategory: Record<string, number>;
  };
}

interface RewriteChange {
  original: string;
  replacement: string;
  category: string;
  position: { start: number; end: number };
  reason: string;  // Kurze Erklärung warum geändert
}
```

#### 1.2 Rewrite-Modi

| Modus | Beschreibung | Beispiel |
|-------|--------------|----------|
| `anonymize` | Entfernt/ersetzt mit generischen Platzhaltern | "Max Mustermann" → "[NAME]" |
| `redact` | Schwärzt sensible Daten | "Max Mustermann" → "███ ██████████" |
| `pseudonymize` | Ersetzt mit fake aber realistischen Daten | "Max Mustermann" → "Thomas Schmidt" |

#### 1.3 Prompt-Template für GPT-5.2 / Claude

```
Du bist ein Datenschutz-Experte. Deine Aufgabe ist es, personenbezogene Daten im Text zu anonymisieren.

MODUS: {mode}
- anonymize: Ersetze mit generischen Platzhaltern wie [NAME], [ADRESSE], [TELEFON]
- redact: Ersetze mit █-Zeichen gleicher Länge
- pseudonymize: Ersetze mit realistischen aber fiktiven deutschen Daten

WICHTIG:
- Behalte die Satzstruktur und Grammatik bei
- Ersetze NUR personenbezogene Daten
- Gib für jede Änderung eine kurze Begründung

TEXT:
{text}

Antworte im JSON-Format:
{
  "rewritten": "...",
  "changes": [
    {
      "original": "...",
      "replacement": "...",
      "category": "name|email|phone|address|iban|date_of_birth|other",
      "reason": "..."
    }
  ]
}
```

---

## 2. Batch-Analyse API

### 2.1 Neuer Endpoint: POST `/api/v2/analyze/batch`

```typescript
// Request
interface BatchAnalyzeRequest {
  texts: BatchTextItem[];
  options?: {
    parallel?: boolean;      // Parallel verarbeiten (default: true)
    maxConcurrent?: number;  // Max parallele Anfragen (default: 5)
    failFast?: boolean;      // Bei erstem Fehler abbrechen (default: false)
  };
}

interface BatchTextItem {
  id: string;           // Client-generierte ID für Zuordnung
  text: string;
  metadata?: {          // Optional: Zusatzinfos
    filename?: string;
    source?: string;
  };
}

// Response
interface BatchAnalyzeResponse {
  success: boolean;
  results: BatchResult[];
  summary: BatchSummary;
  processingTime: number;  // ms
}

interface BatchResult {
  id: string;
  success: boolean;
  error?: string;
  analysis?: AnalyzeV2Response;  // Gleiche Struktur wie Einzel-Analyse
}

interface BatchSummary {
  total: number;
  successful: number;
  failed: number;
  totalRisks: number;
  averageRiskScore: number;
  highestRiskId: string;
  categoryBreakdown: Record<string, number>;
}
```

### 2.2 Implementierungshinweise

```javascript
// Backend: Parallele Verarbeitung mit Rate-Limiting
async function analyzeBatch(texts, options) {
  const { parallel = true, maxConcurrent = 5, failFast = false } = options;

  if (parallel) {
    // Verwende p-limit oder similar für Concurrency Control
    const limit = pLimit(maxConcurrent);
    const promises = texts.map(item =>
      limit(() => analyzeText(item.text, item.id))
    );

    if (failFast) {
      return Promise.all(promises);
    } else {
      return Promise.allSettled(promises);
    }
  } else {
    // Sequentielle Verarbeitung
    const results = [];
    for (const item of texts) {
      results.push(await analyzeText(item.text, item.id));
    }
    return results;
  }
}
```

### 2.3 Rate Limiting & Kosten

| Provider | Rate Limit | Empfehlung |
|----------|------------|------------|
| OpenAI gpt-5-nano | ~10,000 RPM | `maxConcurrent: 10` |
| OpenAI gpt-5.2 | ~500 RPM | `maxConcurrent: 5` |
| Anthropic Claude | ~1,000 RPM | `maxConcurrent: 5` |

**Kostenwarnung:** Bei Batch > 50 Texte, zeige geschätzte Kosten im Frontend

---

## 3. Erweiterte Kategorien

### 3.1 Aktuelle Kategorien (Phase 1)
- `name` - Personennamen
- `email` - E-Mail-Adressen
- `phone` - Telefonnummern
- `address` - Adressen
- `iban` - Bankverbindungen

### 3.2 Neue Kategorien (Phase 2)

```typescript
type RiskCategory =
  // Bestehend
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'iban'

  // NEU: Finanz & Bank
  | 'credit_card'      // Kreditkartennummern
  | 'bic'              // Bank Identifier Code
  | 'account_number'   // Kontonummern (nicht IBAN)

  // NEU: Identifikation
  | 'national_id'      // Personalausweis-Nr
  | 'passport'         // Reisepass-Nr
  | 'tax_id'           // Steuer-ID
  | 'social_security'  // Sozialversicherungs-Nr
  | 'drivers_license'  // Führerschein-Nr

  // NEU: Gesundheit
  | 'health_insurance' // Krankenversicherungs-Nr
  | 'medical_record'   // Medizinische Daten

  // NEU: Digital
  | 'ip_address'       // IP-Adressen
  | 'mac_address'      // MAC-Adressen
  | 'username'         // Benutzernamen
  | 'password'         // Passwörter (im Klartext)
  | 'api_key'          // API-Schlüssel

  // NEU: Persönlich
  | 'date_of_birth'    // Geburtsdatum
  | 'age'              // Alter
  | 'gender'           // Geschlecht
  | 'nationality'      // Nationalität
  | 'religion'         // Religion
  | 'political'        // Politische Meinung
  | 'sexual_orientation' // Sexuelle Orientierung

  // NEU: Biometrisch
  | 'biometric'        // Biometrische Daten
  | 'photo'            // Erkennbare Fotos

  // NEU: Standort
  | 'gps_coordinates'  // GPS-Koordinaten
  | 'license_plate';   // Kfz-Kennzeichen
```

### 3.3 Severity-Matrix

| Kategorie | Severity | DSGVO-Artikel | Grund |
|-----------|----------|---------------|-------|
| `name` | medium | Art. 4 | Identifizierbar |
| `email` | medium | Art. 4 | Direkte Kontaktaufnahme |
| `phone` | medium | Art. 4 | Direkte Kontaktaufnahme |
| `address` | high | Art. 4 | Physischer Standort |
| `iban` | high | Art. 4 | Finanzieller Schaden |
| `credit_card` | critical | Art. 4 | Direkter Finanzzugang |
| `national_id` | critical | Art. 4 | Identitätsdiebstahl |
| `health_insurance` | high | Art. 9 | Besondere Kategorie |
| `medical_record` | critical | Art. 9 | Besondere Kategorie |
| `password` | critical | - | Sicherheitsrisiko |
| `api_key` | critical | - | Sicherheitsrisiko |
| `biometric` | critical | Art. 9 | Besondere Kategorie |
| `religion` | high | Art. 9 | Besondere Kategorie |
| `political` | high | Art. 9 | Besondere Kategorie |
| `sexual_orientation` | high | Art. 9 | Besondere Kategorie |

### 3.4 Regex-Patterns für neue Kategorien

```javascript
const PATTERNS = {
  // Kreditkarte (Visa, Mastercard, Amex)
  credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,

  // BIC/SWIFT
  bic: /\b[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\b/g,

  // Deutsche Steuer-ID (11 Ziffern)
  tax_id: /\b[0-9]{11}\b/g,  // Kontext-Check nötig!

  // Sozialversicherungsnummer (12 Ziffern)
  social_security: /\b[0-9]{2}[0-9]{6}[A-Z][0-9]{3}\b/g,

  // IP-Adresse (IPv4)
  ip_address: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // MAC-Adresse
  mac_address: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,

  // Deutsches Kfz-Kennzeichen
  license_plate: /\b[A-ZÄÖÜ]{1,3}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{1,4}[EH]?\b/g,

  // GPS-Koordinaten
  gps_coordinates: /\b-?[0-9]{1,3}\.[0-9]{4,},\s*-?[0-9]{1,3}\.[0-9]{4,}\b/g,

  // Geburtsdatum (verschiedene Formate)
  date_of_birth: /\b(?:geboren|geb\.|birth|dob)[:\s]*([0-9]{1,2}[.\/-][0-9]{1,2}[.\/-][0-9]{2,4})\b/gi,

  // API-Keys (generisch)
  api_key: /\b(?:sk|pk|api|key|token)[-_]?[a-zA-Z0-9]{20,}\b/gi,
};
```

---

## 4. Provider-Fallback System

### 4.1 Konfiguration (bereits in ENV)

```env
# Primary Provider
OPENAI_API_KEY=****
OPENAI_MODEL_FAST=gpt-5-nano
OPENAI_MODEL_QUALITY=gpt-5.2

# Fallback Provider
ANTHROPIC_API_KEY=****
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

### 4.2 Fallback-Logik

```javascript
async function analyzeWithFallback(text, useQualityModel = false) {
  const providers = [
    {
      name: 'openai',
      model: useQualityModel ? process.env.OPENAI_MODEL_QUALITY : process.env.OPENAI_MODEL_FAST,
      call: (text, model) => callOpenAI(text, model)
    },
    {
      name: 'anthropic',
      model: process.env.ANTHROPIC_MODEL,
      call: (text, model) => callAnthropic(text, model)
    }
  ];

  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name} with ${provider.model}...`);
      const result = await provider.call(text, provider.model);
      return { ...result, provider: provider.name, model: provider.model };
    } catch (error) {
      console.error(`${provider.name} failed:`, error.message);
      if (provider === providers[providers.length - 1]) {
        throw new Error('All providers failed');
      }
      continue;
    }
  }
}
```

### 4.3 Response mit Provider-Info

```typescript
interface AnalyzeV2Response {
  // ... bestehende Felder ...

  // NEU: Provider-Transparenz
  meta: {
    provider: 'openai' | 'anthropic';
    model: string;
    processingTime: number;
    tokensUsed?: {
      input: number;
      output: number;
    };
    fallbackUsed: boolean;
  };
}
```

---

## 5. API v2 - Aktualisierte Struktur

### 5.1 Vollständige Response-Struktur

```typescript
interface AnalyzeV2Response {
  success: boolean;

  // Risk Assessment
  riskScore: number;           // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';

  // Kategorisierte Funde
  categories: RiskFinding[];

  // Zusammenfassung
  summary: {
    total: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byCategory: Record<string, number>;
    topRisks: string[];  // Top 3 Risiken als Text
  };

  // Rewrite-Vorschläge (Phase 2)
  rewriteSuggestions: RewriteSuggestion[];

  // Provider-Meta (Phase 2)
  meta: {
    provider: string;
    model: string;
    processingTime: number;
    tokensUsed?: { input: number; output: number };
    fallbackUsed: boolean;
    apiVersion: 'v2';
  };
}

interface RiskFinding {
  category: RiskCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;           // Menschenlesbare Beschreibung
  match: string;             // Der gefundene Text
  position: {
    start: number;
    end: number;
  };
  confidence: number;        // 0-1, wie sicher ist die Erkennung
  gdprArticle?: string;      // Relevanter DSGVO-Artikel
  recommendation: string;    // Handlungsempfehlung
}

interface RewriteSuggestion {
  original: string;
  suggestion: string;
  category: RiskCategory;
  mode: 'anonymize' | 'redact' | 'pseudonymize';
}
```

---

## 6. Endpoints Übersicht

| Method | Endpoint | Beschreibung | Status |
|--------|----------|--------------|--------|
| POST | `/api/v2/analyze` | Einzeltext-Analyse | ✅ Phase 1 |
| POST | `/api/v2/rewrite` | Text anonymisieren | 🆕 Phase 2 |
| POST | `/api/v2/analyze/batch` | Mehrere Texte | 🆕 Phase 2 |
| GET | `/api/v2/categories` | Liste aller Kategorien | 🆕 Phase 2 |
| GET | `/api/v2/health` | API-Status & Provider-Check | 🆕 Phase 2 |

### 6.1 GET `/api/v2/categories`

```typescript
// Response
interface CategoriesResponse {
  categories: {
    id: RiskCategory;
    name: string;           // Deutscher Name
    description: string;
    severity: string;
    gdprArticle?: string;
    examples: string[];
  }[];
}
```

### 6.2 GET `/api/v2/health`

```typescript
// Response
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  providers: {
    openai: {
      status: 'ok' | 'error';
      model: string;
      latency?: number;
    };
    anthropic: {
      status: 'ok' | 'error';
      model: string;
      latency?: number;
    };
  };
  version: string;
  uptime: number;
}
```

---

## 7. Implementierungsreihenfolge

### Woche 1: Core Features
1. ✅ Erweiterte Kategorien & Regex-Patterns
2. ✅ Provider-Fallback System
3. ✅ `/api/v2/health` Endpoint

### Woche 2: Rewrite
4. ✅ `/api/v2/rewrite` Endpoint
5. ✅ Prompt-Templates für alle 3 Modi
6. ✅ Tests für Rewrite-Qualität

### Woche 3: Batch
7. ✅ `/api/v2/analyze/batch` Endpoint
8. ✅ Rate-Limiting & Concurrency
9. ✅ `/api/v2/categories` Endpoint

---

## 8. Testing

### 8.1 Test-Texte

```javascript
const TEST_CASES = [
  {
    name: 'Vollständiger Datensatz',
    text: `
      Max Mustermann, geboren am 15.03.1985, wohnhaft in
      Musterstraße 123, 12345 Berlin. Erreichbar unter
      max.mustermann@email.de oder +49 170 1234567.
      IBAN: DE89 3704 0044 0532 0130 00
      Steuer-ID: 12345678901
      IP bei letztem Login: 192.168.1.100
    `,
    expectedCategories: ['name', 'date_of_birth', 'address', 'email', 'phone', 'iban', 'tax_id', 'ip_address']
  },
  {
    name: 'Medizinische Daten',
    text: 'Patient Hans Meier, Versichertennummer A123456789, Diagnose: Diabetes Typ 2',
    expectedCategories: ['name', 'health_insurance', 'medical_record']
  },
  {
    name: 'Finanzdaten',
    text: 'Kreditkarte 4532015112830366, BIC COBADEFFXXX',
    expectedCategories: ['credit_card', 'bic']
  }
];
```

---

## 9. Frontend-Kommunikation

Das Frontend ist vorbereitet für:
- Alle neuen Kategorien (Icons & Farben werden dynamisch geladen)
- Batch-Analyse UI (Tab vorhanden)
- Rewrite-Modi (Buttons vorhanden)

**Nach Backend-Fertigstellung:**
1. Ping an Frontend-Team
2. Integration testen
3. E2E Tests durchführen

---

## Fragen?

Bei Unklarheiten: Issue erstellen oder im Chat melden.

**Nächster Schritt:** Backend-Implementation starten, Frontend wird parallel vorbereitet.
