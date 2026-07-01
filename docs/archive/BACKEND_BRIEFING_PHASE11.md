# Backend Briefing: Phase 11 - Privacy Templates

## Übersicht

Phase 11 bietet **vorgefertigte, datenschutzfreundliche Text-Templates** für verschiedene Anwendungsfälle. Nutzer können sichere Vorlagen für Social Media Profile, Bewerbungen, Online-Formulare und mehr verwenden.

**Version:** 11.0.0

## Neue API-Endpoints

### 1. GET `/api/v2/templates/categories`

Listet alle Template-Kategorien.

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "social_media",
      "name": "Social Media",
      "icon": "📱",
      "description": "Sichere Bio-Texte für Social Media Profile",
      "templateCount": 12
    },
    {
      "id": "job_application",
      "name": "Bewerbungen",
      "icon": "💼",
      "description": "Datenschutzfreundliche Bewerbungstexte",
      "templateCount": 8
    },
    {
      "id": "online_forms",
      "name": "Online-Formulare",
      "icon": "📝",
      "description": "Minimale Angaben für Registrierungen",
      "templateCount": 6
    },
    {
      "id": "email_responses",
      "name": "E-Mail Antworten",
      "icon": "✉️",
      "description": "Ablehnungen von Datenanfragen",
      "templateCount": 10
    },
    {
      "id": "gdpr_requests",
      "name": "DSGVO-Anfragen",
      "icon": "⚖️",
      "description": "Auskunfts- und Löschungsanfragen",
      "templateCount": 5
    }
  ]
}
```

### 2. GET `/api/v2/templates/category/:categoryId`

Listet alle Templates einer Kategorie.

**Response:**
```json
{
  "success": true,
  "category": {
    "id": "social_media",
    "name": "Social Media",
    "icon": "📱"
  },
  "templates": [
    {
      "id": "sm_bio_minimal",
      "name": "Minimale Bio",
      "description": "Kurze Bio ohne persönliche Details",
      "privacyScore": 95,
      "popularity": 1250,
      "tags": ["instagram", "twitter", "tiktok"],
      "preview": "Kreativ unterwegs | Kaffee-Enthusiast ☕"
    },
    {
      "id": "sm_bio_professional",
      "name": "Professionelle Bio",
      "description": "Business-fokussiert ohne Privates",
      "privacyScore": 88,
      "popularity": 890,
      "tags": ["linkedin", "xing"],
      "preview": "Marketing | Digital Strategy | Speaker"
    }
  ]
}
```

### 3. GET `/api/v2/templates/:templateId`

Ruft ein spezifisches Template mit Varianten ab.

**Response:**
```json
{
  "success": true,
  "template": {
    "id": "sm_bio_minimal",
    "name": "Minimale Bio",
    "category": "social_media",
    "description": "Eine kurze, datenschutzfreundliche Bio ohne persönliche Identifikatoren",
    "privacyScore": 95,
    "privacyAnalysis": {
      "piiCount": 0,
      "locationRevealed": false,
      "ageRevealed": false,
      "employerRevealed": false
    },
    "variants": [
      {
        "id": "variant_creative",
        "name": "Kreativ",
        "content": "Kreativ unterwegs | Kaffee-Enthusiast ☕ | Immer neugierig",
        "tone": "casual"
      },
      {
        "id": "variant_minimal",
        "name": "Ultra-Minimal",
        "content": "🎨 📚 🎵",
        "tone": "minimal"
      },
      {
        "id": "variant_mysterious",
        "name": "Geheimnisvoll",
        "content": "Manchmal hier, manchmal dort. Meist irgendwo dazwischen.",
        "tone": "mysterious"
      }
    ],
    "customizable": true,
    "placeholders": [
      {
        "key": "{{HOBBY}}",
        "description": "Ein Hobby (ohne zu spezifisch zu sein)",
        "examples": ["Musik", "Kunst", "Sport", "Lesen"]
      },
      {
        "key": "{{EMOJI}}",
        "description": "Ein passendes Emoji",
        "examples": ["🎨", "📚", "🎵", "⚡"]
      }
    ],
    "tips": [
      "Vermeide deinen echten Namen",
      "Keine Altersangaben oder Geburtsdaten",
      "Standort nur sehr allgemein (Land, nicht Stadt)",
      "Arbeitgeber weglassen oder nur Branche nennen"
    ],
    "doNot": [
      "Geburtsdatum teilen",
      "Genauen Wohnort angeben",
      "Arbeitgeber + Position nennen",
      "Familienstand erwähnen"
    ]
  }
}
```

### 4. POST `/api/v2/templates/customize`

Personalisiert ein Template mit Nutzer-Eingaben.

**Request:**
```json
{
  "templateId": "sm_bio_minimal",
  "variantId": "variant_creative",
  "customizations": {
    "{{HOBBY}}": "Fotografie",
    "{{EMOJI}}": "📸"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "content": "Kreativ unterwegs | Fotografie 📸 | Immer neugierig",
    "privacyScore": 92,
    "privacyWarnings": [],
    "copyReady": true
  }
}
```

### 5. POST `/api/v2/templates/analyze`

Analysiert einen benutzerdefinierten Text und schlägt Verbesserungen vor.

**Request:**
```json
{
  "text": "Max, 28, aus München. Arbeite bei BMW als Ingenieur.",
  "context": "social_media_bio"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "privacyScore": 15,
    "grade": "F",
    "issues": [
      {
        "type": "name",
        "found": "Max",
        "severity": "high",
        "suggestion": "Entferne deinen echten Namen oder nutze einen Spitznamen"
      },
      {
        "type": "age",
        "found": "28",
        "severity": "medium",
        "suggestion": "Alter weglassen oder nur Dekade angeben (20er)"
      },
      {
        "type": "location",
        "found": "München",
        "severity": "high",
        "suggestion": "Nur Land oder Region angeben, nicht die Stadt"
      },
      {
        "type": "employer",
        "found": "BMW",
        "severity": "high",
        "suggestion": "Nur Branche nennen: 'Automobilindustrie'"
      }
    ],
    "suggestedVersion": "Ingenieur in der Automobilbranche | Bayern 🚗",
    "improvedScore": 78
  }
}
```

### 6. GET `/api/v2/templates/gdpr/:requestType`

Gibt DSGVO-Anfrage-Templates zurück.

**Request Types:** `access`, `deletion`, `rectification`, `portability`, `objection`

**Response:**
```json
{
  "success": true,
  "requestType": "deletion",
  "template": {
    "subject": "Antrag auf Löschung personenbezogener Daten (Art. 17 DSGVO)",
    "body": "Sehr geehrte Damen und Herren,\n\nhiermit mache ich von meinem Recht auf Löschung gemäß Art. 17 DSGVO Gebrauch.\n\nIch fordere Sie auf, sämtliche über mich gespeicherten personenbezogenen Daten unverzüglich zu löschen.\n\nBetroffen sind insbesondere:\n- {{DATENARTEN}}\n\nBitte bestätigen Sie die Löschung innerhalb der gesetzlichen Frist von einem Monat.\n\nMit freundlichen Grüßen\n{{NAME}}",
    "placeholders": [
      {
        "key": "{{DATENARTEN}}",
        "description": "Welche Daten gelöscht werden sollen",
        "examples": ["E-Mail-Adresse", "Kundenkonto", "Bestellhistorie"]
      },
      {
        "key": "{{NAME}}",
        "description": "Dein Name (für formelle Anfragen nötig)"
      }
    ],
    "legalBasis": "Art. 17 DSGVO - Recht auf Löschung",
    "responseDeadline": "30 Tage",
    "tips": [
      "Per Einschreiben senden für Nachweis",
      "Kopie der Anfrage aufbewahren",
      "Frist notieren und nachfassen"
    ]
  }
}
```

### 7. POST `/api/v2/templates/favorite`

Speichert ein Template als Favorit (lokal im Frontend, anonymisiert im Backend).

**Request:**
```json
{
  "templateId": "sm_bio_minimal",
  "sessionId": "anon_session_123"
}
```

## Datenstrukturen

### Template Categories
```javascript
const TEMPLATE_CATEGORIES = [
  {
    id: 'social_media',
    name: 'Social Media',
    icon: '📱',
    subcategories: ['bio', 'posts', 'comments']
  },
  {
    id: 'job_application',
    name: 'Bewerbungen',
    icon: '💼',
    subcategories: ['cover_letter', 'cv_summary', 'references']
  },
  {
    id: 'online_forms',
    name: 'Online-Formulare',
    icon: '📝',
    subcategories: ['registration', 'contact', 'surveys']
  },
  {
    id: 'email_responses',
    name: 'E-Mail Antworten',
    icon: '✉️',
    subcategories: ['data_requests', 'marketing_optout', 'consent_withdrawal']
  },
  {
    id: 'gdpr_requests',
    name: 'DSGVO-Anfragen',
    icon: '⚖️',
    subcategories: ['access', 'deletion', 'rectification', 'portability']
  }
];
```

### Privacy Score Calculation
```javascript
function calculatePrivacyScore(text, context) {
  let score = 100;

  const deductions = {
    full_name: -25,
    age_exact: -15,
    age_decade: -5,
    city: -20,
    country: -5,
    employer_specific: -25,
    employer_industry: -10,
    job_title_specific: -15,
    job_title_general: -5,
    family_status: -10,
    phone_number: -30,
    email: -20
  };

  // Analyze and deduct...
  return Math.max(0, score);
}
```

## Vorgefertigte Templates (Beispiele)

### Social Media Bio - Minimal
```
ID: sm_bio_minimal
Variants:
- "Kreativ unterwegs | {{HOBBY}} {{EMOJI}}"
- "{{EMOJI}} {{EMOJI}} {{EMOJI}}"
- "Irgendwo zwischen Kaffee und Chaos"
Privacy Score: 95
```

### DSGVO Löschungsanfrage
```
ID: gdpr_deletion
Subject: "Antrag auf Löschung personenbezogener Daten (Art. 17 DSGVO)"
Privacy Score: 100 (formell notwendige Daten)
```

### Bewerbung - Kurzprofil
```
ID: job_cv_summary
Content: "Erfahrene Fachkraft im Bereich {{BRANCHE}} mit Schwerpunkt {{SKILL}}.
          Mehrjährige Berufserfahrung in {{REGION}}."
Privacy Score: 75
Tips: "Vermeide genaue Jahreszahlen, nutze 'mehrjährig' statt '5 Jahre'"
```

## Integration mit anderen Phasen

- **Phase 2 (Analysis):** Templates können durch den Analyzer geprüft werden
- **Phase 5 (Predictive):** Warnung wenn Template-Anpassungen riskant sind
- **Phase 10 (Coach):** Coach kann Templates empfehlen

## Frontend-Anforderungen

1. **Template Browser:**
   - Kategorien-Navigation
   - Suche und Filter
   - Vorschau mit Privacy Score

2. **Template Customizer:**
   - Live-Vorschau beim Anpassen
   - Privacy Score Update in Echtzeit
   - Copy-to-Clipboard Button

3. **Text Analyzer:**
   - Eigenen Text eingeben
   - Verbesserungsvorschläge anzeigen
   - "Als Template speichern" Option

4. **DSGVO Generator:**
   - Schritt-für-Schritt Assistent
   - Auswahl der Anfrageart
   - Export als PDF/Text
