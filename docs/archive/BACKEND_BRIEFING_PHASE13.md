# Backend Briefing: Phase 13 - Privacy Policy Analyzer

## Übersicht

Phase 13 implementiert einen KI-gestützten Privacy Policy Analyzer, der Datenschutzerklärungen und AGBs analysiert, zusammenfasst und bewertet. Nutzer können URLs eingeben oder Text einfügen und erhalten eine verständliche Analyse.

**Ziel-Version:** 13.0.0

---

## Neue API-Endpoints

### 1. POST `/api/v2/policy/analyze`

Analysiert eine Datenschutzerklärung von einer URL oder als Text.

**Request:**
```json
{
  "url": "https://example.com/privacy",
  "text": null,
  "language": "de",
  "options": {
    "summarize": true,
    "scoreBreakdown": true,
    "redFlags": true,
    "dataCollection": true,
    "thirdParties": true,
    "userRights": true,
    "comparison": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "analysis_abc123",
  "source": {
    "type": "url",
    "url": "https://example.com/privacy",
    "title": "Datenschutzerklärung - Example GmbH",
    "lastUpdated": "2024-01-10",
    "wordCount": 4523,
    "readingTime": "18 min"
  },
  "summary": {
    "tldr": "Diese App sammelt umfangreiche Daten und teilt sie mit 47 Partnern. Werbe-Tracking ist standardmäßig aktiviert. Löschung ist möglich, aber kompliziert.",
    "keyPoints": [
      {
        "icon": "📊",
        "category": "Datensammlung",
        "summary": "Sammelt: Name, E-Mail, Standort, Gerätedaten, Nutzungsverhalten",
        "severity": "high"
      },
      {
        "icon": "🔗",
        "category": "Datenweitergabe",
        "summary": "Teilt Daten mit 47 Werbepartnern und Analysediensten",
        "severity": "critical"
      },
      {
        "icon": "🍪",
        "category": "Cookies & Tracking",
        "summary": "Verwendet 23 Cookies, davon 18 für Werbung",
        "severity": "high"
      },
      {
        "icon": "⏱️",
        "category": "Speicherdauer",
        "summary": "Daten werden bis zu 7 Jahre gespeichert",
        "severity": "medium"
      },
      {
        "icon": "🗑️",
        "category": "Löschung",
        "summary": "Löschung möglich per E-Mail, Bearbeitung in 30 Tagen",
        "severity": "low"
      }
    ],
    "verdict": "Diese Datenschutzerklärung enthält mehrere bedenkliche Praktiken, insbesondere die umfangreiche Datenweitergabe an Dritte."
  },
  "score": {
    "overall": 35,
    "grade": "D",
    "label": "Bedenklich",
    "breakdown": {
      "transparency": { "score": 45, "label": "Mäßig", "details": "Einige wichtige Infos fehlen oder sind schwer zu finden" },
      "dataMinimization": { "score": 20, "label": "Schlecht", "details": "Sammelt mehr Daten als nötig" },
      "userControl": { "score": 40, "label": "Mäßig", "details": "Opt-out möglich, aber nicht einfach" },
      "thirdPartySharing": { "score": 15, "label": "Kritisch", "details": "Teilt mit vielen Partnern" },
      "security": { "score": 55, "label": "Akzeptabel", "details": "Erwähnt Verschlüsselung" },
      "gdprCompliance": { "score": 50, "label": "Teilweise", "details": "Einige DSGVO-Anforderungen nicht erfüllt" }
    }
  },
  "redFlags": [
    {
      "id": "rf_001",
      "severity": "critical",
      "icon": "🚨",
      "title": "Verkauf von Nutzerdaten",
      "description": "Die Policy erwähnt explizit den Verkauf von Nutzerdaten an Dritte",
      "quote": "We may sell your personal information to third parties...",
      "recommendation": "Opt-out über 'Do Not Sell' Link nutzen"
    },
    {
      "id": "rf_002",
      "severity": "high",
      "icon": "⚠️",
      "title": "Standort-Tracking",
      "description": "Permanentes Standort-Tracking auch bei geschlossener App",
      "quote": "We collect your precise location data continuously...",
      "recommendation": "Standortberechtigung auf 'Nur bei Nutzung' setzen"
    },
    {
      "id": "rf_003",
      "severity": "medium",
      "icon": "📧",
      "title": "E-Mail-Weitergabe",
      "description": "E-Mail-Adresse wird an Marketing-Partner weitergegeben",
      "quote": "Your email address may be shared with our marketing partners...",
      "recommendation": "Dedizierte E-Mail für diesen Dienst verwenden"
    }
  ],
  "dataCollection": {
    "collectedData": [
      {
        "category": "Identifikation",
        "items": ["Name", "E-Mail", "Telefonnummer", "Geburtsdatum"],
        "purpose": "Kontoverwaltung",
        "required": true,
        "severity": "medium"
      },
      {
        "category": "Standort",
        "items": ["GPS-Koordinaten", "IP-Adresse", "WLAN-Netzwerke"],
        "purpose": "Lokalisierte Dienste & Werbung",
        "required": false,
        "severity": "high"
      },
      {
        "category": "Gerätedaten",
        "items": ["Geräte-ID", "Betriebssystem", "Browser", "Installierte Apps"],
        "purpose": "Analyse & Werbung",
        "required": false,
        "severity": "medium"
      },
      {
        "category": "Nutzungsverhalten",
        "items": ["Klicks", "Verweildauer", "Suchverlauf", "Kaufhistorie"],
        "purpose": "Personalisierung & Werbung",
        "required": false,
        "severity": "medium"
      }
    ],
    "retentionPeriod": "7 Jahre oder bis zur Löschanfrage",
    "dataPortability": true,
    "deletionProcess": "Per E-Mail mit Identitätsnachweis"
  },
  "thirdParties": {
    "count": 47,
    "categories": [
      {
        "category": "Werbung",
        "count": 28,
        "companies": ["Google Ads", "Facebook", "Amazon Ads", "..."],
        "dataShared": ["Geräte-ID", "Interessen", "Kaufverhalten"],
        "severity": "high"
      },
      {
        "category": "Analyse",
        "count": 12,
        "companies": ["Google Analytics", "Mixpanel", "Amplitude"],
        "dataShared": ["Nutzungsverhalten", "Gerätedaten"],
        "severity": "medium"
      },
      {
        "category": "Cloud-Dienste",
        "count": 5,
        "companies": ["AWS", "Google Cloud"],
        "dataShared": ["Alle Daten (Hosting)"],
        "severity": "low"
      },
      {
        "category": "Zahlungsabwicklung",
        "count": 2,
        "companies": ["Stripe", "PayPal"],
        "dataShared": ["Zahlungsdaten"],
        "severity": "low"
      }
    ],
    "internationalTransfers": {
      "hasTransfers": true,
      "countries": ["USA", "Irland", "Singapur"],
      "safeguards": "Standard Contractual Clauses"
    }
  },
  "userRights": {
    "gdprCompliant": "partial",
    "rights": [
      {
        "right": "Auskunft (Art. 15)",
        "available": true,
        "process": "Per E-Mail an privacy@example.com",
        "responseTime": "30 Tage",
        "difficulty": "easy"
      },
      {
        "right": "Löschung (Art. 17)",
        "available": true,
        "process": "Per E-Mail mit Identitätsnachweis",
        "responseTime": "30 Tage",
        "difficulty": "medium"
      },
      {
        "right": "Datenübertragbarkeit (Art. 20)",
        "available": true,
        "process": "Export-Funktion im Account",
        "format": "JSON",
        "difficulty": "easy"
      },
      {
        "right": "Widerspruch (Art. 21)",
        "available": true,
        "process": "Einstellungen im Account",
        "difficulty": "medium"
      },
      {
        "right": "Widerruf Einwilligung",
        "available": true,
        "process": "Cookie-Banner erneut aufrufen",
        "difficulty": "easy"
      }
    ],
    "contactInfo": {
      "email": "privacy@example.com",
      "dpo": "dpo@example.com",
      "postalAddress": "Example GmbH, Musterstraße 1, 10115 Berlin"
    }
  },
  "cookies": {
    "total": 23,
    "breakdown": {
      "necessary": 3,
      "functional": 2,
      "analytics": 5,
      "advertising": 13
    },
    "details": [
      {
        "name": "_ga",
        "provider": "Google Analytics",
        "purpose": "Nutzer-Tracking",
        "expiry": "2 Jahre",
        "category": "analytics"
      },
      {
        "name": "_fbp",
        "provider": "Facebook",
        "purpose": "Werbe-Tracking",
        "expiry": "3 Monate",
        "category": "advertising"
      }
    ],
    "consentMechanism": "Cookie-Banner mit Opt-in für nicht-essentielle Cookies"
  },
  "recommendations": [
    {
      "priority": 1,
      "action": "Standort-Tracking deaktivieren",
      "impact": "Reduziert Datensammlung erheblich",
      "howTo": "Einstellungen > Datenschutz > Standort > Nur bei Nutzung"
    },
    {
      "priority": 2,
      "action": "Werbe-Cookies ablehnen",
      "impact": "Verhindert Tracking durch 18 Werbe-Partner",
      "howTo": "Cookie-Banner > Alle ablehnen oder Nur notwendige"
    },
    {
      "priority": 3,
      "action": "Personalisierung deaktivieren",
      "impact": "Reduziert Profiling",
      "howTo": "Einstellungen > Datenschutz > Personalisierte Werbung > Aus"
    }
  ],
  "comparisonHint": {
    "betterAlternatives": ["Signal", "ProtonMail", "DuckDuckGo"],
    "message": "Diese Alternativen haben deutlich bessere Datenschutz-Praktiken"
  }
}
```

---

### 2. POST `/api/v2/policy/compare`

Vergleicht mehrere Datenschutzerklärungen.

**Request:**
```json
{
  "policies": [
    { "url": "https://whatsapp.com/privacy" },
    { "url": "https://signal.org/privacy" },
    { "url": "https://telegram.org/privacy" }
  ],
  "criteria": ["dataCollection", "thirdParties", "encryption", "userRights"]
}
```

**Response:**
```json
{
  "success": true,
  "comparison": {
    "summary": "Signal bietet den besten Datenschutz, gefolgt von Telegram. WhatsApp sammelt die meisten Daten.",
    "winner": {
      "name": "Signal",
      "score": 92,
      "reason": "Minimale Datensammlung, keine Werbung, Ende-zu-Ende-Verschlüsselung"
    },
    "policies": [
      {
        "name": "WhatsApp",
        "url": "https://whatsapp.com/privacy",
        "score": 45,
        "pros": ["Ende-zu-Ende-Verschlüsselung", "DSGVO-konform"],
        "cons": ["Teilt Daten mit Meta", "Metadaten-Sammlung", "Kontaktlisten-Upload"]
      },
      {
        "name": "Signal",
        "url": "https://signal.org/privacy",
        "score": 92,
        "pros": ["Minimale Datensammlung", "Open Source", "Keine Werbung"],
        "cons": ["Telefonnummer erforderlich"]
      },
      {
        "name": "Telegram",
        "url": "https://telegram.org/privacy",
        "score": 68,
        "pros": ["Cloud-Sync", "Selbstzerstörende Nachrichten"],
        "cons": ["Keine E2E-Verschlüsselung standardmäßig", "Server in mehreren Ländern"]
      }
    ],
    "criteriaComparison": {
      "dataCollection": {
        "WhatsApp": { "score": 40, "details": "Sammelt Metadaten, Kontakte, Standort" },
        "Signal": { "score": 95, "details": "Nur Telefonnummer, keine Inhalte" },
        "Telegram": { "score": 60, "details": "Nachrichten auf Server, aber verschlüsselt" }
      },
      "thirdParties": {
        "WhatsApp": { "score": 30, "details": "Teilt mit Meta-Unternehmen" },
        "Signal": { "score": 100, "details": "Keine Weitergabe" },
        "Telegram": { "score": 80, "details": "Minimale Weitergabe" }
      }
    }
  }
}
```

---

### 3. POST `/api/v2/policy/quick-check`

Schneller Check einer URL ohne vollständige Analyse.

**Request:**
```json
{
  "url": "https://example.com/privacy"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com/privacy",
  "quickScore": 35,
  "grade": "D",
  "label": "Bedenklich",
  "topConcerns": [
    "Teilt Daten mit 47 Partnern",
    "Verkauft möglicherweise Nutzerdaten",
    "Permanentes Standort-Tracking"
  ],
  "recommendation": "Vorsicht bei der Nutzung dieses Dienstes. Überprüfe die Einstellungen und minimiere die geteilten Daten.",
  "fullAnalysisAvailable": true
}
```

---

### 4. GET `/api/v2/policy/known/{domain}`

Liefert gecachte Analyse für bekannte Dienste.

**Response:**
```json
{
  "success": true,
  "domain": "facebook.com",
  "cached": true,
  "lastUpdated": "2024-01-15",
  "score": 28,
  "grade": "F",
  "summary": "Facebook sammelt umfangreiche Daten für Werbezwecke und teilt diese mit Partnern.",
  "keyIssues": [
    "Umfangreiches Profiling",
    "Datenweitergabe an Werbepartner",
    "Komplexe Datenschutzeinstellungen"
  ],
  "userRights": {
    "deletion": "Möglich über Einstellungen",
    "export": "JSON-Export verfügbar"
  }
}
```

---

### 5. GET `/api/v2/policy/database`

Liefert Liste aller bekannten/analysierten Dienste.

**Query Parameters:**
- `category` - Filter by category (social, messaging, shopping, etc.)
- `minScore` - Minimum score filter
- `sort` - Sort by (score, name, lastUpdated)

**Response:**
```json
{
  "success": true,
  "totalPolicies": 250,
  "categories": [
    { "id": "social", "name": "Soziale Netzwerke", "count": 45 },
    { "id": "messaging", "name": "Messenger", "count": 20 },
    { "id": "shopping", "name": "Online-Shopping", "count": 60 },
    { "id": "streaming", "name": "Streaming", "count": 25 },
    { "id": "productivity", "name": "Produktivität", "count": 40 }
  ],
  "topRated": [
    { "domain": "signal.org", "name": "Signal", "score": 92, "grade": "A" },
    { "domain": "protonmail.com", "name": "ProtonMail", "score": 90, "grade": "A" },
    { "domain": "duckduckgo.com", "name": "DuckDuckGo", "score": 88, "grade": "A" }
  ],
  "worstRated": [
    { "domain": "tiktok.com", "name": "TikTok", "score": 22, "grade": "F" },
    { "domain": "facebook.com", "name": "Facebook", "score": 28, "grade": "F" }
  ],
  "recentlyUpdated": [
    { "domain": "instagram.com", "updatedAt": "2024-01-14", "score": 32 }
  ]
}
```

---

### 6. POST `/api/v2/policy/extract-text`

Extrahiert Text aus einer Datenschutz-URL (Hilfsfunktion).

**Request:**
```json
{
  "url": "https://example.com/privacy"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com/privacy",
  "title": "Datenschutzerklärung",
  "text": "...",
  "wordCount": 4523,
  "language": "de",
  "lastModified": "2024-01-10"
}
```

---

## Datenmodelle

### PolicyAnalysis
```typescript
interface PolicyAnalysis {
  analysisId: string;
  source: PolicySource;
  summary: PolicySummary;
  score: PolicyScore;
  redFlags: RedFlag[];
  dataCollection: DataCollection;
  thirdParties: ThirdParties;
  userRights: UserRights;
  cookies: CookieAnalysis;
  recommendations: Recommendation[];
  analyzedAt: string;
}
```

### PolicyScore
```typescript
interface PolicyScore {
  overall: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  breakdown: {
    transparency: ScoreComponent;
    dataMinimization: ScoreComponent;
    userControl: ScoreComponent;
    thirdPartySharing: ScoreComponent;
    security: ScoreComponent;
    gdprCompliance: ScoreComponent;
  };
}
```

### RedFlag
```typescript
interface RedFlag {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  description: string;
  quote?: string;
  recommendation: string;
}
```

---

## Bekannte Dienste Datenbank

Pre-analysierte Datenschutzerklärungen für schnelle Abfragen:

### Kategorien
```json
[
  {
    "category": "social",
    "services": [
      { "domain": "facebook.com", "score": 28, "grade": "F" },
      { "domain": "instagram.com", "score": 32, "grade": "D" },
      { "domain": "twitter.com", "score": 38, "grade": "D" },
      { "domain": "linkedin.com", "score": 45, "grade": "C" },
      { "domain": "tiktok.com", "score": 22, "grade": "F" }
    ]
  },
  {
    "category": "messaging",
    "services": [
      { "domain": "whatsapp.com", "score": 45, "grade": "C" },
      { "domain": "signal.org", "score": 92, "grade": "A" },
      { "domain": "telegram.org", "score": 68, "grade": "B" },
      { "domain": "discord.com", "score": 42, "grade": "C" }
    ]
  },
  {
    "category": "shopping",
    "services": [
      { "domain": "amazon.de", "score": 40, "grade": "C" },
      { "domain": "ebay.de", "score": 48, "grade": "C" },
      { "domain": "zalando.de", "score": 55, "grade": "C" }
    ]
  },
  {
    "category": "streaming",
    "services": [
      { "domain": "netflix.com", "score": 52, "grade": "C" },
      { "domain": "spotify.com", "score": 48, "grade": "C" },
      { "domain": "youtube.com", "score": 35, "grade": "D" }
    ]
  }
]
```

---

## Red Flags Datenbank

Bekannte problematische Formulierungen:

```json
[
  {
    "id": "data_sale",
    "patterns": ["sell your data", "verkaufen Ihre Daten", "share with partners for monetary"],
    "severity": "critical",
    "title": "Verkauf von Nutzerdaten",
    "description": "Der Dienst verkauft möglicherweise Ihre Daten"
  },
  {
    "id": "unlimited_retention",
    "patterns": ["indefinitely", "unbegrenzt", "as long as necessary", "solange erforderlich"],
    "severity": "high",
    "title": "Unbegrenzte Speicherdauer",
    "description": "Daten werden ohne klares Ablaufdatum gespeichert"
  },
  {
    "id": "third_party_sharing",
    "patterns": ["share with third parties", "an Dritte weitergeben", "partners may access"],
    "severity": "high",
    "title": "Umfangreiche Datenweitergabe",
    "description": "Daten werden an viele Dritte weitergegeben"
  },
  {
    "id": "location_tracking",
    "patterns": ["continuous location", "background location", "precise location", "genauen Standort"],
    "severity": "high",
    "title": "Standort-Tracking",
    "description": "Permanentes oder präzises Standort-Tracking"
  },
  {
    "id": "policy_changes",
    "patterns": ["change this policy at any time", "jederzeit ändern", "without notice"],
    "severity": "medium",
    "title": "Änderungen ohne Benachrichtigung",
    "description": "Policy kann ohne Vorwarnung geändert werden"
  }
]
```

---

## Scoring-Algorithmus

### Gewichtung
```javascript
const SCORE_WEIGHTS = {
  transparency: 0.15,
  dataMinimization: 0.20,
  userControl: 0.15,
  thirdPartySharing: 0.25,
  security: 0.10,
  gdprCompliance: 0.15
};

const GRADE_THRESHOLDS = {
  A: 80,  // Excellent
  B: 65,  // Good
  C: 50,  // Acceptable
  D: 35,  // Poor
  F: 0    // Fail
};
```

### Faktoren
- **Transparency**: Klarheit der Sprache, vollständige Informationen
- **Data Minimization**: Nur notwendige Daten, kurze Speicherfristen
- **User Control**: Opt-out Möglichkeiten, Einstellungen
- **Third Party Sharing**: Anzahl und Art der Empfänger
- **Security**: Verschlüsselung, Sicherheitsmaßnahmen erwähnt
- **GDPR Compliance**: Alle Rechte implementiert, DPO vorhanden

---

## Sicherheitsanforderungen

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/policy/analyze` | 10 | pro Minute |
| `/policy/compare` | 5 | pro Minute |
| `/policy/quick-check` | 30 | pro Minute |
| `/policy/known/{domain}` | 60 | pro Minute |
| `/policy/database` | 30 | pro Minute |

### Caching
- Bekannte Dienste: 24 Stunden Cache
- Neue Analysen: 1 Stunde Cache
- Vergleiche: Kein Cache

---

## Implementierungshinweise

### Priorität 1 - Core Features
1. Quick-Check Endpoint
2. Bekannte Dienste Datenbank (50+ Dienste)
3. Basis-Scoring

### Priorität 2 - Vollständige Analyse
1. URL-Text-Extraktion
2. Red Flag Detection
3. Detaillierte Score-Aufschlüsselung

### Priorität 3 - Advanced Features
1. Vergleichsfunktion
2. Cookie-Analyse
3. DSGVO-Compliance Check

---

## Version History

| Version | Datum | Änderungen |
|---------|-------|------------|
| 13.0.0 | TBD | Initial Release - Privacy Policy Analyzer |

---

## Zusammenfassung der neuen Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/v2/policy/analyze` | Vollständige Policy-Analyse |
| POST | `/api/v2/policy/compare` | Policies vergleichen |
| POST | `/api/v2/policy/quick-check` | Schneller Check |
| GET | `/api/v2/policy/known/{domain}` | Bekannte Dienste |
| GET | `/api/v2/policy/database` | Dienste-Datenbank |
| POST | `/api/v2/policy/extract-text` | Text extrahieren |
