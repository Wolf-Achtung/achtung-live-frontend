# Backend Briefing: Phase 6 - Browser Extension Pro

## Übersicht

Phase 6 implementiert eine **Browser Extension** für Chrome und Firefox, die Nutzer in Echtzeit beim Tippen schützt. Die Extension analysiert Eingabefelder, erkennt Dark Patterns und warnt vor übermäßigem Tracking.

**Version:** 6.0.0
**Codename:** Guardian
**Priorität:** Hoch (User Experience)

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Popup     │  │  Background │  │   Content Script    │  │
│  │    UI       │  │   Worker    │  │   (per page)        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                    Chrome Storage                            │
│                    (settings, cache)                         │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   achtung.live API     │
              │   /api/v2/extension/*  │
              └────────────────────────┘
```

---

## Neue API Endpoints

### 6.1 POST /api/v2/extension/analyze-field

Analysiert Text aus einem Eingabefeld in Echtzeit.

**Request:**
```json
{
  "text": "Mein Name ist Max Müller, ich wohne in...",
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
        "suggestion": "Verwende einen Spitznamen oder nur den Vornamen"
      },
      {
        "type": "location_hint",
        "value": "ich wohne in",
        "position": { "start": 28, "end": 40 },
        "severity": "medium",
        "suggestion": "Vermeide Ortsangaben in öffentlichen Kommentaren"
      }
    ],
    "quickActions": [
      {
        "action": "anonymize",
        "label": "Namen anonymisieren",
        "replacement": "Mein Name ist [Name], ich wohne in..."
      }
    ],
    "safeToSend": false,
    "warningMessage": "Dieser Text enthält identifizierende Informationen"
  },
  "meta": {
    "processingTime": 45,
    "cached": false
  }
}
```

---

### 6.2 POST /api/v2/extension/analyze-form

Analysiert ein komplettes Formular auf ungewöhnliche oder verdächtige Felder.

**Request:**
```json
{
  "formFields": [
    { "name": "email", "type": "email", "required": true, "label": "E-Mail" },
    { "name": "phone", "type": "tel", "required": true, "label": "Telefon" },
    { "name": "ssn", "type": "text", "required": true, "label": "Sozialversicherungsnummer" },
    { "name": "mother_maiden", "type": "text", "required": false, "label": "Mädchenname der Mutter" },
    { "name": "income", "type": "number", "required": true, "label": "Jahreseinkommen" }
  ],
  "formAction": "https://example.com/submit",
  "pageUrl": "https://example.com/apply",
  "pageDomain": "example.com",
  "pageTitle": "Bewerbungsformular"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formRiskScore": 85,
    "riskLevel": "high",
    "totalFields": 5,
    "sensitiveFields": 4,
    "unusualFields": [
      {
        "field": "ssn",
        "reason": "Sozialversicherungsnummer wird selten für Bewerbungen benötigt",
        "severity": "critical",
        "recommendation": "Frage nach, warum diese Information benötigt wird"
      },
      {
        "field": "mother_maiden",
        "reason": "Typische Sicherheitsfrage - könnte für Identitätsdiebstahl missbraucht werden",
        "severity": "high",
        "recommendation": "Dieses Feld nicht ausfüllen oder falsche Angabe machen"
      },
      {
        "field": "income",
        "reason": "Einkommensdaten sind sensibel und oft nicht erforderlich",
        "severity": "medium",
        "recommendation": "Prüfe die Datenschutzerklärung"
      }
    ],
    "normalFields": ["email", "phone"],
    "formPurposeGuess": "job_application",
    "dataMinimizationScore": 0.3,
    "warnings": [
      "Dieses Formular sammelt mehr Daten als üblich für eine Bewerbung",
      "3 von 5 Feldern enthalten hochsensible Informationen"
    ],
    "recommendations": [
      "Prüfe die Datenschutzerklärung vor dem Absenden",
      "Frage den Anbieter, warum SSN benötigt wird",
      "Erwäge, optionale Felder leer zu lassen"
    ]
  }
}
```

---

### 6.3 POST /api/v2/extension/detect-dark-patterns

Analysiert eine Seite auf Dark Patterns und manipulative UI-Elemente.

**Request:**
```json
{
  "pageUrl": "https://example.com/checkout",
  "pageDomain": "example.com",
  "elements": {
    "buttons": [
      { "text": "Ja, ich möchte den Newsletter!", "classes": ["btn-primary", "btn-lg"] },
      { "text": "Nein danke", "classes": ["btn-link", "text-muted", "small"] }
    ],
    "checkboxes": [
      { "label": "Ich möchte Werbung erhalten", "checked": true, "visible": true },
      { "label": "Daten an Partner weitergeben", "checked": true, "visible": false }
    ],
    "text": [
      "Nur noch 2 Artikel verfügbar!",
      "23 andere schauen sich dieses Produkt gerade an",
      "Angebot endet in 00:14:32"
    ],
    "modals": [
      { "type": "exit_intent", "hasCloseButton": false }
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
        "description": "Der Ablehn-Button verwendet beschämende Sprache oder ist visuell unterdrückt",
        "evidence": "'Nein danke' ist klein und ausgegraut",
        "severity": "medium"
      },
      {
        "type": "hidden_checkbox",
        "element": "checkbox",
        "description": "Vorab angekreuzte Checkbox ist versteckt",
        "evidence": "'Daten an Partner weitergeben' ist nicht sichtbar aber aktiviert",
        "severity": "critical"
      },
      {
        "type": "fake_urgency",
        "element": "text",
        "description": "Künstliche Dringlichkeit durch Countdown oder Knappheit",
        "evidence": "'Nur noch 2 Artikel', '23 andere schauen', Countdown-Timer",
        "severity": "medium"
      },
      {
        "type": "forced_continuity",
        "element": "checkbox",
        "description": "Newsletter-Anmeldung ist vorausgewählt",
        "evidence": "'Ich möchte Werbung erhalten' ist bereits aktiviert",
        "severity": "low"
      },
      {
        "type": "roach_motel",
        "element": "modal",
        "description": "Exit-Intent Popup ohne einfache Schließmöglichkeit",
        "evidence": "Modal hat keinen Close-Button",
        "severity": "high"
      }
    ],
    "trustScore": 22,
    "recommendations": [
      "Deaktiviere alle vorab angekreuzten Checkboxen",
      "Ignoriere Countdown-Timer und Knappheitsanzeigen",
      "Suche nach versteckten Opt-Ins in den AGB"
    ],
    "comparison": {
      "averageScore": 45,
      "percentile": 15,
      "verdict": "Diese Seite verwendet mehr Dark Patterns als 85% der analysierten Seiten"
    }
  }
}
```

---

### 6.4 POST /api/v2/extension/analyze-cookies

Analysiert Cookie-Consent-Banner und vergleicht deklarierte vs. tatsächliche Tracker.

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
    "declaredPurposes": ["Analytics", "Marketing"],
    "declaredVendors": 12
  },
  "detectedTrackers": [
    { "name": "Google Analytics", "type": "analytics" },
    { "name": "Facebook Pixel", "type": "marketing" },
    { "name": "Hotjar", "type": "analytics" },
    { "name": "Unknown Tracker 1", "domain": "shady-tracker.com", "type": "unknown" },
    { "name": "Unknown Tracker 2", "domain": "data-collector.net", "type": "unknown" }
  ],
  "cookies": [
    { "name": "_ga", "domain": ".example.com", "expiry": "2 years" },
    { "name": "_fbp", "domain": ".example.com", "expiry": "3 months" },
    { "name": "session", "domain": "example.com", "expiry": "session" }
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
        "description": "Kein 'Alle ablehnen' Button oder nur schwer zu finden",
        "gdprViolation": true
      },
      {
        "type": "undeclared_trackers",
        "severity": "critical",
        "description": "2 Tracker wurden nicht im Consent-Banner deklariert",
        "trackers": ["shady-tracker.com", "data-collector.net"]
      },
      {
        "type": "excessive_cookie_lifetime",
        "severity": "medium",
        "description": "Cookies mit übermäßig langer Lebensdauer (>1 Jahr)",
        "cookies": ["_ga (2 years)"]
      },
      {
        "type": "dark_pattern_consent",
        "severity": "medium",
        "description": "'Alle akzeptieren' ist prominent, Ablehnen versteckt"
      }
    ],
    "trackerSummary": {
      "declared": 12,
      "detected": 5,
      "undeclared": 2,
      "categories": {
        "analytics": 2,
        "marketing": 1,
        "unknown": 2
      }
    },
    "recommendations": [
      "Suche nach 'Einstellungen' oder 'Mehr Optionen' im Banner",
      "Nutze einen Cookie-Blocker für nicht deklarierte Tracker",
      "Diese Seite könnte gegen DSGVO verstoßen"
    ],
    "autoRejectPossible": true,
    "autoRejectSelector": ".cookie-banner .btn-secondary, #reject-cookies"
  }
}
```

---

### 6.5 GET /api/v2/extension/dark-patterns

Liste aller bekannten Dark Pattern Typen für Client-Side Detection.

**Response:**
```json
{
  "patterns": [
    {
      "id": "confirmshaming",
      "name": "Confirmshaming",
      "description": "Beschämende Sprache für Ablehn-Option",
      "examples": ["Nein, ich hasse Geld sparen", "Ich möchte keine Vorteile"],
      "detection": {
        "buttonTextPatterns": ["nein.*hasse", "kein.*interesse", "nicht.*möchte"],
        "visualCues": ["text-muted", "small", "btn-link"]
      }
    },
    {
      "id": "hidden_costs",
      "name": "Versteckte Kosten",
      "description": "Zusätzliche Gebühren werden erst spät angezeigt",
      "examples": ["Servicegebühr", "Bearbeitungsgebühr"],
      "detection": {
        "priceChangePatterns": ["gebühr", "aufpreis", "zusätzlich"]
      }
    },
    {
      "id": "fake_urgency",
      "name": "Künstliche Dringlichkeit",
      "description": "Gefälschte Countdown-Timer oder Knappheitsanzeigen",
      "examples": ["Nur noch 2 verfügbar", "Angebot endet in..."],
      "detection": {
        "textPatterns": ["nur noch \\d+", "\\d+ andere", "endet in"],
        "elements": ["countdown", "timer", "stock-warning"]
      }
    },
    {
      "id": "trick_questions",
      "name": "Trickfragen",
      "description": "Verwirrende doppelte Verneinungen",
      "examples": ["Deaktivieren Sie, um keine E-Mails NICHT zu erhalten"],
      "detection": {
        "textPatterns": ["nicht.*nicht", "kein.*kein", "deaktivieren.*erhalten"]
      }
    },
    {
      "id": "sneak_into_basket",
      "name": "Eingeschlichene Produkte",
      "description": "Produkte werden automatisch zum Warenkorb hinzugefügt",
      "detection": {
        "checkboxPatterns": ["versicherung", "garantie", "schutz"],
        "preChecked": true
      }
    },
    {
      "id": "roach_motel",
      "name": "Roach Motel",
      "description": "Einfach anzumelden, schwer zu kündigen",
      "examples": ["Kündigung nur per Brief", "Telefonische Kündigung erforderlich"],
      "detection": {
        "accountPages": true,
        "cancellationPatterns": ["brief", "telefon", "schriftlich"]
      }
    },
    {
      "id": "privacy_zuckering",
      "name": "Privacy Zuckering",
      "description": "Verwirrende Datenschutzeinstellungen",
      "detection": {
        "togglePatterns": ["öffentlich.*standard", "teilen.*aktiviert"],
        "settingsComplexity": "high"
      }
    },
    {
      "id": "bait_and_switch",
      "name": "Bait and Switch",
      "description": "Beworbenes Produkt ist nicht verfügbar, Alternative wird angeboten",
      "detection": {
        "textPatterns": ["nicht.*verfügbar.*aber", "stattdessen", "alternative"]
      }
    }
  ],
  "version": "1.0",
  "lastUpdated": "2025-01-18"
}
```

---

### 6.6 GET /api/v2/extension/tracker-database

Datenbank bekannter Tracker für Client-Side Detection.

**Response:**
```json
{
  "trackers": {
    "google-analytics.com": {
      "name": "Google Analytics",
      "company": "Google",
      "category": "analytics",
      "risk": "medium",
      "cookies": ["_ga", "_gid", "_gat"],
      "description": "Web-Analyse-Dienst"
    },
    "facebook.com": {
      "name": "Facebook Pixel",
      "company": "Meta",
      "category": "marketing",
      "risk": "high",
      "cookies": ["_fbp", "fr"],
      "description": "Tracking für Werbung und Retargeting"
    },
    "doubleclick.net": {
      "name": "DoubleClick",
      "company": "Google",
      "category": "advertising",
      "risk": "high",
      "cookies": ["IDE", "DSID"],
      "description": "Werbe-Tracking-Netzwerk"
    }
  },
  "categories": {
    "analytics": { "risk": "medium", "description": "Nutzungsanalyse" },
    "marketing": { "risk": "high", "description": "Werbung und Retargeting" },
    "advertising": { "risk": "high", "description": "Werbenetzwerke" },
    "social": { "risk": "medium", "description": "Social Media Widgets" },
    "essential": { "risk": "low", "description": "Notwendige Funktionen" },
    "unknown": { "risk": "high", "description": "Unbekannter Tracker" }
  },
  "version": "1.0",
  "totalTrackers": 847,
  "lastUpdated": "2025-01-18"
}
```

---

## Extension Storage Schema

```javascript
// chrome.storage.local
{
  // User Settings
  "settings": {
    "enabled": true,
    "liveTypingGuard": true,
    "formAnalysis": true,
    "darkPatternDetection": true,
    "cookieAnalysis": true,
    "notificationLevel": "medium", // "off", "low", "medium", "high"
    "autoRejectCookies": false,
    "whitelist": ["trusted-site.com"],
    "blacklist": []
  },

  // Cached Data
  "cache": {
    "darkPatterns": { /* from API */ },
    "trackerDatabase": { /* from API */ },
    "lastUpdate": "2025-01-18T12:00:00Z"
  },

  // Statistics
  "stats": {
    "totalAnalyses": 1234,
    "warningsShown": 456,
    "darkPatternsDetected": 89,
    "trackersBlocked": 567,
    "formsAnalyzed": 123
  },

  // Per-Site Data
  "siteData": {
    "example.com": {
      "trustScore": 65,
      "darkPatternScore": 23,
      "lastVisit": "2025-01-18T10:30:00Z",
      "findings": []
    }
  }
}
```

---

## Rate Limiting für Extension

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/extension/analyze-field` | 60/min | Per User |
| `/extension/analyze-form` | 20/min | Per User |
| `/extension/detect-dark-patterns` | 10/min | Per User |
| `/extension/analyze-cookies` | 10/min | Per User |
| `/extension/dark-patterns` | 100/day | Global Cache |
| `/extension/tracker-database` | 100/day | Global Cache |

---

## Implementierungshinweise

### Live Typing Analysis (Debounced)

```javascript
// Content Script - Debounce für Performance
let analyzeTimeout;

inputField.addEventListener('input', (e) => {
  clearTimeout(analyzeTimeout);
  analyzeTimeout = setTimeout(() => {
    analyzeFieldContent(e.target.value, e.target);
  }, 500); // 500ms Debounce
});
```

### Dark Pattern Detection (Client-Side First)

```javascript
// Meiste Detection client-side für Performance
function detectDarkPatterns(document) {
  const patterns = [];

  // Confirmshaming Check
  const buttons = document.querySelectorAll('button, a.btn');
  buttons.forEach(btn => {
    if (isConfirmshaming(btn.textContent, btn.classList)) {
      patterns.push({ type: 'confirmshaming', element: btn });
    }
  });

  // Hidden Checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (cb.checked && !isVisible(cb)) {
      patterns.push({ type: 'hidden_checkbox', element: cb });
    }
  });

  return patterns;
}
```

---

## Erwartete Endpoints Zusammenfassung

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/v2/extension/analyze-field` | POST | Echtzeit-Textanalyse |
| `/api/v2/extension/analyze-form` | POST | Formular-Analyse |
| `/api/v2/extension/detect-dark-patterns` | POST | Dark Pattern Detection |
| `/api/v2/extension/analyze-cookies` | POST | Cookie/Tracker Analyse |
| `/api/v2/extension/dark-patterns` | GET | Dark Pattern Database |
| `/api/v2/extension/tracker-database` | GET | Tracker Database |

---

## Browser Compatibility

| Browser | Manifest Version | Status |
|---------|-----------------|--------|
| Chrome | MV3 | Primary |
| Firefox | MV2/MV3 | Supported |
| Edge | MV3 | Compatible |
| Safari | - | Future |

---

## Zusammenfassung

Phase 6 bringt achtung.live direkt zum Nutzer durch:

1. **Live Typing Guard** - Schutz beim Tippen in Echtzeit
2. **Form Analysis** - Warnung vor verdächtigen Formularen
3. **Dark Pattern Detection** - Erkennung manipulativer UI
4. **Cookie/Tracker Analysis** - Transparenz über Tracking

**Technische Anforderungen:**
- Manifest V3 für Chrome
- Service Worker statt Background Pages
- Content Scripts für DOM-Zugriff
- chrome.storage für Einstellungen
- Debounced API Calls für Performance
