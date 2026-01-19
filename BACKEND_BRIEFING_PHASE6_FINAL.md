# Backend Briefing: Phase 6 - Browser Extension Pro

**Datum:** 2026-01-19
**Version:** 6.0.0
**Codename:** Guardian
**Status:** ⚠️ BACKEND IMPLEMENTIERUNG AUSSTEHEND

---

## Aktueller Stand

| Komponente | Status | Details |
|------------|--------|---------|
| Frontend Extension | ✅ KOMPLETT | Chrome MV3, alle Features |
| Backend Endpoints | ❌ FEHLT | 6 Endpoints benötigt |
| Netlify Functions | ⏳ Vorbereitet | Warten auf Backend |

### Frontend Extension - Was bereits existiert:

```
extension/
├── manifest.json          # Chrome MV3 Manifest
├── background.js          # Service Worker (630 Zeilen)
├── content.js             # Content Script
├── popup.html/js          # Popup UI
├── styles/                # CSS Styles
└── icons/                 # Extension Icons
```

**Implementierte Features:**
- ✅ Live Typing Guard (Debounced)
- ✅ Form Analysis
- ✅ Dark Pattern Detection
- ✅ Cookie/Tracker Analysis
- ✅ Chrome Storage Management
- ✅ Client-Side Fallbacks (funktioniert ohne Backend!)
- ✅ Statistics Tracking
- ✅ Per-Site Data

---

## Benötigte Backend Endpoints

### 1. POST `/api/v2/extension/analyze-field`

**Zweck:** Echtzeit-Analyse von Eingabefeld-Text

**Request:**
```json
{
  "text": "Mein Name ist Max Müller, ich wohne in Berlin",
  "fieldType": "textarea",
  "fieldName": "comment",
  "pageUrl": "https://example.com/contact",
  "pageDomain": "example.com",
  "context": {
    "isLoginForm": false,
    "isPaymentForm": false,
    "formFieldCount": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "riskScore": 65,
    "riskLevel": "medium",
    "findings": [
      {
        "type": "full_name",
        "value": "Max Müller",
        "position": { "start": 16, "end": 26 },
        "severity": "high",
        "suggestion": "Verwende einen Spitznamen"
      }
    ],
    "quickActions": [
      {
        "action": "anonymize",
        "label": "Namen anonymisieren",
        "replacement": "Mein Name ist [Name]..."
      }
    ],
    "safeToSend": false
  },
  "meta": { "processingTime": 45 }
}
```

**Hinweis:** Frontend nutzt aktuell `/api/v2/analyze` als Fallback mit vereinfachter Response-Transformation.

---

### 2. POST `/api/v2/extension/analyze-form`

**Zweck:** Analyse eines kompletten Formulars auf verdächtige Felder

**Request:**
```json
{
  "formFields": [
    { "name": "email", "type": "email", "required": true, "label": "E-Mail" },
    { "name": "ssn", "type": "text", "required": true, "label": "Sozialversicherungsnummer" },
    { "name": "mother_maiden", "type": "text", "required": false, "label": "Mädchenname der Mutter" }
  ],
  "formAction": "https://example.com/submit",
  "pageUrl": "https://example.com/apply",
  "pageDomain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formRiskScore": 85,
    "riskLevel": "high",
    "totalFields": 3,
    "sensitiveFields": 2,
    "unusualFields": [
      {
        "field": "ssn",
        "reason": "Sozialversicherungsnummer wird selten benötigt",
        "severity": "critical",
        "recommendation": "Frage nach dem Grund"
      }
    ],
    "dataMinimizationScore": 0.3,
    "recommendations": ["Prüfe die Datenschutzerklärung"]
  }
}
```

**Sensitive Field Keywords (für Backend):**
```javascript
const SENSITIVE_FIELDS = [
  'ssn', 'social_security', 'tax_id', 'passport',
  'mother_maiden', 'income', 'salary', 'credit_card',
  'sozialversicherung', 'steuernummer', 'ausweis',
  'mädchenname', 'einkommen', 'gehalt', 'kreditkarte', 'geburtsort'
];
```

---

### 3. POST `/api/v2/extension/detect-dark-patterns`

**Zweck:** Analyse einer Seite auf manipulative UI-Elemente

**Request:**
```json
{
  "pageUrl": "https://example.com/checkout",
  "pageDomain": "example.com",
  "elements": {
    "buttons": [
      { "text": "Ja, ich möchte!", "classes": ["btn-primary", "btn-lg"] },
      { "text": "Nein danke", "classes": ["btn-link", "text-muted", "small"] }
    ],
    "checkboxes": [
      { "label": "Newsletter erhalten", "checked": true, "visible": true },
      { "label": "Daten an Partner", "checked": true, "visible": false }
    ],
    "text": [
      "Nur noch 2 Artikel verfügbar!",
      "23 andere schauen sich das an"
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "darkPatternScore": 78,
    "patternsFound": [
      {
        "type": "confirmshaming",
        "element": "button",
        "description": "Ablehn-Button ist visuell unterdrückt",
        "severity": "medium"
      },
      {
        "type": "hidden_checkbox",
        "element": "checkbox",
        "description": "Vorab aktivierte, versteckte Checkbox",
        "severity": "critical"
      },
      {
        "type": "fake_urgency",
        "element": "text",
        "description": "Künstliche Dringlichkeit",
        "severity": "medium"
      }
    ],
    "trustScore": 22,
    "recommendations": ["Deaktiviere alle Checkboxen", "Ignoriere Countdown-Timer"]
  }
}
```

**Dark Pattern Types:**
```javascript
const DARK_PATTERNS = [
  'confirmshaming',      // Beschämende Sprache
  'hidden_checkbox',     // Versteckte aktivierte Checkbox
  'preselected_option',  // Vorab aktivierte Option
  'fake_urgency',        // Countdown, "nur noch X"
  'fake_scarcity',       // "23 andere schauen"
  'trick_questions',     // Doppelte Verneinungen
  'sneak_into_basket',   // Auto-Add to Cart
  'roach_motel',         // Einfach rein, schwer raus
  'privacy_zuckering',   // Verwirrende Privacy Settings
  'bait_and_switch'      // Produkt nicht verfügbar
];
```

---

### 4. POST `/api/v2/extension/analyze-cookies`

**Zweck:** Cookie-Banner und Tracker-Analyse

**Request:**
```json
{
  "pageUrl": "https://example.com",
  "pageDomain": "example.com",
  "consentBanner": {
    "found": true,
    "hasRejectAll": false,
    "rejectAllVisible": false,
    "acceptAllProminent": true,
    "declaredVendors": 12
  },
  "detectedTrackers": [
    { "name": "Google Analytics", "domain": "google-analytics.com", "type": "analytics" },
    { "name": "Unknown", "domain": "shady-tracker.com", "type": "unknown" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "complianceScore": 35,
    "complianceLevel": "poor",
    "issues": [
      {
        "type": "missing_reject_all",
        "severity": "high",
        "description": "Kein 'Alle ablehnen' Button",
        "gdprViolation": true
      },
      {
        "type": "undeclared_trackers",
        "severity": "critical",
        "description": "Nicht deklarierte Tracker gefunden",
        "trackers": ["shady-tracker.com"]
      }
    ],
    "trackerSummary": {
      "declared": 12,
      "detected": 2,
      "undeclared": 1
    },
    "recommendations": ["Nutze 'Einstellungen' im Banner"]
  }
}
```

---

### 5. GET `/api/v2/extension/dark-patterns`

**Zweck:** Datenbank aller bekannten Dark Patterns für Client-Side Caching

**Response:**
```json
{
  "patterns": [
    {
      "id": "confirmshaming",
      "name": "Confirmshaming",
      "description": "Beschämende Sprache für Ablehn-Option",
      "examples": ["Nein, ich hasse Geld sparen"],
      "detection": {
        "buttonTextPatterns": ["nein.*hasse", "kein.*interesse"],
        "visualCues": ["text-muted", "small", "btn-link"]
      }
    },
    {
      "id": "fake_urgency",
      "name": "Künstliche Dringlichkeit",
      "description": "Gefälschte Timer oder Knappheit",
      "detection": {
        "textPatterns": ["nur noch \\d+", "endet in", "andere schauen"]
      }
    }
  ],
  "version": "1.0",
  "totalPatterns": 10,
  "lastUpdated": "2026-01-19"
}
```

---

### 6. GET `/api/v2/extension/tracker-database`

**Zweck:** Datenbank bekannter Tracker für Client-Side Detection

**Response:**
```json
{
  "trackers": {
    "google-analytics.com": {
      "name": "Google Analytics",
      "company": "Google",
      "category": "analytics",
      "risk": "medium",
      "cookies": ["_ga", "_gid"]
    },
    "facebook.com": {
      "name": "Facebook Pixel",
      "company": "Meta",
      "category": "marketing",
      "risk": "high",
      "cookies": ["_fbp", "fr"]
    },
    "doubleclick.net": {
      "name": "DoubleClick",
      "company": "Google",
      "category": "advertising",
      "risk": "high"
    }
  },
  "categories": {
    "analytics": { "risk": "medium", "description": "Nutzungsanalyse" },
    "marketing": { "risk": "high", "description": "Werbung & Retargeting" },
    "advertising": { "risk": "high", "description": "Werbenetzwerke" }
  },
  "version": "1.0",
  "totalTrackers": 100,
  "lastUpdated": "2026-01-19"
}
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/extension/analyze-field` | 60/min | Per IP |
| `/extension/analyze-form` | 20/min | Per IP |
| `/extension/detect-dark-patterns` | 10/min | Per IP |
| `/extension/analyze-cookies` | 10/min | Per IP |
| `/extension/dark-patterns` | 100/day | Global (cacheable) |
| `/extension/tracker-database` | 100/day | Global (cacheable) |

---

## Implementierungshinweise für Backend

### 1. Nutze vorhandene Patterns
Die `/api/v2/analyze` Logik kann für `analyze-field` wiederverwendet werden, erweitert um:
- Position-Tracking für Findings
- Quick Actions Generation
- Context-aware Analysis

### 2. Sensitive Fields Liste
Pflege eine erweiterbare Liste sensitiver Feldnamen für verschiedene Sprachen.

### 3. Dark Patterns Database
Statische Daten können aus dem Frontend übernommen werden (`extension/background.js` Zeilen 534-556).

### 4. Tracker Database
Ähnlich wie Data Broker Database in Phase 7 - erweiterbar, mit bekannten Trackern.

### 5. GDPR Compliance Scoring
```javascript
function calculateComplianceScore(issues) {
  let score = 100;
  issues.forEach(issue => {
    switch(issue.severity) {
      case 'critical': score -= 30; break;
      case 'high': score -= 20; break;
      case 'medium': score -= 10; break;
      case 'low': score -= 5; break;
    }
  });
  return Math.max(0, score);
}
```

---

## Zusammenfassung

| Endpoint | Methode | Priorität | Komplexität |
|----------|---------|-----------|-------------|
| `/extension/analyze-field` | POST | Hoch | Mittel (nutzt /analyze) |
| `/extension/analyze-form` | POST | Hoch | Niedrig |
| `/extension/detect-dark-patterns` | POST | Mittel | Mittel |
| `/extension/analyze-cookies` | POST | Mittel | Mittel |
| `/extension/dark-patterns` | GET | Niedrig | Niedrig (statisch) |
| `/extension/tracker-database` | GET | Niedrig | Niedrig (statisch) |

**Geschätzte Backend-Arbeit:** Die Endpunkte 5 und 6 sind statische Datenbanken (wie bei anderen Phasen). Endpunkte 1-4 sind Score-Berechnungen basierend auf Pattern-Matching.

**CORS:** Bereits für alle Origins aktiviert - keine Änderungen nötig.

---

## Nach Backend-Implementierung

Sobald die Endpoints verfügbar sind:
1. Netlify Functions erstellen (6 neue)
2. Extension `background.js` API-Calls aktivieren
3. Extension im Chrome Web Store veröffentlichen

**Kontakt bei Fragen:** Diese Dokumentation basiert auf dem existierenden Frontend-Code in `/extension/`.
