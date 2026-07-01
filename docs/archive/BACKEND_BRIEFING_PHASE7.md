# Backend Briefing: Phase 7 - Digital Footprint Scanner

## Übersicht

Phase 7 implementiert einen umfassenden Digital Footprint Scanner, der persönliche Daten im Internet aufspürt, Datenlecks prüft und konkrete Löschempfehlungen gibt.

**Ziel-Version:** 7.0.0

---

## Neue API-Endpoints

### 1. POST `/api/v2/footprint/scan`

Führt einen vollständigen Digital Footprint Scan durch.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "Max Mustermann",
  "phone": "+49123456789",
  "username": "maxmuster",
  "options": {
    "checkBreaches": true,
    "checkPastebins": true,
    "checkSocialMedia": true,
    "checkDataBrokers": true,
    "checkSearchEngines": true,
    "deepScan": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "scanId": "scan_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "summary": {
    "overallRisk": "high",
    "riskScore": 78,
    "totalExposures": 23,
    "criticalFindings": 3,
    "actionRequired": 12
  },
  "breaches": {
    "found": true,
    "count": 5,
    "items": [
      {
        "id": "breach_001",
        "source": "LinkedIn",
        "date": "2021-06-22",
        "severity": "high",
        "exposedData": ["email", "password_hash", "name", "phone"],
        "description": "Massive Datenpanne mit 700M Nutzerdaten",
        "isPwnedVerified": true,
        "recommendations": [
          "Passwort sofort ändern",
          "2FA aktivieren",
          "Auf Phishing achten"
        ]
      }
    ]
  },
  "pastebins": {
    "found": true,
    "count": 2,
    "items": [
      {
        "id": "paste_001",
        "source": "Pastebin",
        "url": "https://pastebin.com/xxx",
        "date": "2023-05-10",
        "context": "Email in Credential-Liste gefunden",
        "severity": "critical",
        "snippet": "***@example.com:****",
        "canRequestRemoval": true
      }
    ]
  },
  "socialMedia": {
    "found": true,
    "count": 8,
    "profiles": [
      {
        "platform": "Facebook",
        "url": "https://facebook.com/maxmuster",
        "username": "maxmuster",
        "publicInfo": ["name", "photo", "location", "workplace"],
        "privacyScore": 35,
        "recommendations": [
          "Profil auf privat stellen",
          "Öffentliche Infos reduzieren"
        ]
      },
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com/in/maxmuster",
        "username": "maxmuster",
        "publicInfo": ["name", "photo", "job", "education", "connections"],
        "privacyScore": 25,
        "recommendations": [
          "Profilsichtbarkeit einschränken",
          "Verbindungen verbergen"
        ]
      }
    ]
  },
  "dataBrokers": {
    "found": true,
    "count": 12,
    "items": [
      {
        "broker": "Spokeo",
        "category": "people_search",
        "country": "US",
        "dataFound": ["name", "address", "phone", "relatives"],
        "optOutUrl": "https://spokeo.com/optout",
        "optOutDifficulty": "medium",
        "estimatedTime": "3-5 Tage"
      },
      {
        "broker": "BeenVerified",
        "category": "background_check",
        "country": "US",
        "dataFound": ["name", "address", "criminal_records"],
        "optOutUrl": "https://beenverified.com/optout",
        "optOutDifficulty": "hard",
        "estimatedTime": "7-14 Tage"
      }
    ]
  },
  "searchEngines": {
    "google": {
      "resultsCount": 1250,
      "topResults": [
        {
          "title": "Max Mustermann - LinkedIn",
          "url": "https://linkedin.com/in/maxmuster",
          "snippet": "Max Mustermann - Software Engineer bei..."
        }
      ],
      "imagesFound": 23,
      "newsArticles": 2
    },
    "bing": {
      "resultsCount": 890,
      "topResults": []
    }
  },
  "darkWeb": {
    "scanned": true,
    "found": true,
    "items": [
      {
        "type": "credential_leak",
        "source": "Dark Web Forum",
        "date": "2024-01-10",
        "severity": "critical",
        "dataTypes": ["email", "password"],
        "actionRequired": true
      }
    ]
  },
  "recommendations": {
    "immediate": [
      {
        "priority": 1,
        "action": "Passwort für LinkedIn ändern",
        "reason": "Aktives Datenleck gefunden",
        "howTo": "https://linkedin.com/settings/password"
      },
      {
        "priority": 2,
        "action": "2FA für alle Konten aktivieren",
        "reason": "Credentials im Dark Web gefunden"
      }
    ],
    "shortTerm": [
      {
        "priority": 3,
        "action": "Opt-out bei 12 Data Brokern",
        "reason": "Persönliche Daten öffentlich verfügbar",
        "automatedOptOut": true
      }
    ],
    "longTerm": [
      {
        "priority": 4,
        "action": "Google Alerts einrichten",
        "reason": "Zukünftige Erwähnungen überwachen"
      }
    ]
  }
}
```

---

### 2. POST `/api/v2/footprint/breach-check`

Schneller Breach-Check nur für Email (wie Have I Been Pwned).

**Request:**
```json
{
  "email": "user@example.com",
  "includeDetails": true
}
```

**Response:**
```json
{
  "success": true,
  "email": "u***@example.com",
  "breached": true,
  "breachCount": 5,
  "firstBreach": "2017-03-15",
  "latestBreach": "2023-11-20",
  "breaches": [
    {
      "name": "LinkedIn",
      "domain": "linkedin.com",
      "date": "2021-06-22",
      "compromisedAccounts": 700000000,
      "dataClasses": ["email", "password", "name", "phone"],
      "description": "Im Juni 2021 wurden 700 Millionen LinkedIn-Nutzerdaten...",
      "severity": "high",
      "isVerified": true,
      "isSensitive": false,
      "logoUrl": "https://api.achtung.live/logos/linkedin.png"
    }
  ],
  "pasteCount": 2,
  "recommendations": [
    "Ändern Sie Ihr LinkedIn-Passwort sofort",
    "Verwenden Sie einen Passwort-Manager",
    "Aktivieren Sie 2-Faktor-Authentifizierung"
  ]
}
```

---

### 3. POST `/api/v2/footprint/social-scan`

Sucht nach Social Media Profilen basierend auf Username/Email.

**Request:**
```json
{
  "username": "maxmuster",
  "email": "user@example.com",
  "platforms": ["all"]
}
```

**Response:**
```json
{
  "success": true,
  "profilesFound": 12,
  "profiles": [
    {
      "platform": "twitter",
      "displayName": "Twitter/X",
      "found": true,
      "url": "https://twitter.com/maxmuster",
      "username": "maxmuster",
      "displayUsername": "@maxmuster",
      "isVerified": false,
      "isPublic": true,
      "followers": 234,
      "following": 156,
      "posts": 89,
      "accountAge": "5 Jahre",
      "lastActive": "2024-01-14",
      "publicData": {
        "name": "Max Mustermann",
        "bio": "Software Developer | Privacy Enthusiast",
        "location": "Berlin",
        "website": "https://maxmuster.de",
        "profileImage": true
      },
      "privacyScore": 40,
      "privacyIssues": [
        "Standort öffentlich sichtbar",
        "Echte Name im Profil",
        "Arbeitgeber in Bio"
      ],
      "recommendations": [
        "Standort aus Profil entfernen",
        "Tweets auf geschützt stellen"
      ]
    },
    {
      "platform": "github",
      "displayName": "GitHub",
      "found": true,
      "url": "https://github.com/maxmuster",
      "username": "maxmuster",
      "isPublic": true,
      "publicData": {
        "name": "Max Mustermann",
        "email": "exposed@example.com",
        "company": "TechCorp",
        "location": "Berlin",
        "repositories": 45
      },
      "privacyScore": 30,
      "privacyIssues": [
        "Email in Commits sichtbar",
        "Arbeitgeber öffentlich"
      ]
    }
  ],
  "platformsChecked": [
    "twitter", "facebook", "instagram", "linkedin", "github",
    "tiktok", "youtube", "reddit", "pinterest", "snapchat",
    "discord", "telegram"
  ],
  "notFound": ["snapchat", "tiktok", "discord"]
}
```

---

### 4. POST `/api/v2/footprint/databroker-scan`

Prüft bekannte Data Broker auf vorhandene Einträge.

**Request:**
```json
{
  "name": "Max Mustermann",
  "email": "user@example.com",
  "phone": "+49123456789",
  "address": {
    "street": "Musterstraße 123",
    "city": "Berlin",
    "zip": "10115",
    "country": "DE"
  },
  "region": "EU"
}
```

**Response:**
```json
{
  "success": true,
  "brokersScanned": 85,
  "brokersWithData": 18,
  "items": [
    {
      "broker": "Spokeo",
      "website": "spokeo.com",
      "category": "people_search",
      "region": "US",
      "dataTypes": ["name", "address", "phone", "email", "relatives", "social_profiles"],
      "confirmed": true,
      "profileUrl": "https://spokeo.com/Max-Mustermann",
      "optOut": {
        "available": true,
        "url": "https://spokeo.com/optout",
        "method": "web_form",
        "requiresId": false,
        "difficulty": "easy",
        "estimatedDays": 3,
        "instructions": [
          "Besuchen Sie die Opt-out Seite",
          "Geben Sie Ihre Email-Adresse ein",
          "Bestätigen Sie den Link in der Email"
        ]
      }
    },
    {
      "broker": "Acxiom",
      "website": "acxiom.com",
      "category": "marketing_data",
      "region": "Global",
      "dataTypes": ["name", "address", "purchase_history", "demographics"],
      "confirmed": "likely",
      "optOut": {
        "available": true,
        "url": "https://isapps.acxiom.com/optout",
        "method": "web_form",
        "requiresId": true,
        "difficulty": "medium",
        "estimatedDays": 45,
        "gdprApplicable": true
      }
    }
  ],
  "summary": {
    "easyOptOuts": 8,
    "mediumOptOuts": 6,
    "hardOptOuts": 4,
    "totalEstimatedTime": "2-3 Wochen",
    "gdprBrokers": 12,
    "automatedOptOutAvailable": 5
  },
  "categories": {
    "people_search": 6,
    "marketing_data": 5,
    "background_check": 3,
    "credit_reporting": 2,
    "recruitment": 2
  }
}
```

---

### 5. POST `/api/v2/footprint/optout-request`

Initiiert automatisierten Opt-out bei einem Data Broker.

**Request:**
```json
{
  "broker": "spokeo",
  "userData": {
    "name": "Max Mustermann",
    "email": "user@example.com"
  },
  "method": "automated"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "optout_xyz789",
  "broker": "Spokeo",
  "status": "submitted",
  "method": "automated_email",
  "submittedAt": "2024-01-15T10:35:00Z",
  "estimatedCompletion": "2024-01-18T10:35:00Z",
  "nextSteps": [
    "Bestätigungs-Email prüfen",
    "Link in Email klicken"
  ],
  "trackingUrl": "https://api.achtung.live/optout/status/optout_xyz789"
}
```

---

### 6. GET `/api/v2/footprint/optout-status/{requestId}`

Prüft Status eines Opt-out Requests.

**Response:**
```json
{
  "requestId": "optout_xyz789",
  "broker": "Spokeo",
  "status": "completed",
  "submittedAt": "2024-01-15T10:35:00Z",
  "completedAt": "2024-01-17T14:20:00Z",
  "verified": true,
  "message": "Ihre Daten wurden erfolgreich entfernt"
}
```

---

### 7. GET `/api/v2/footprint/databrokers`

Liefert die Datenbank aller bekannten Data Broker.

**Query Parameters:**
- `region` - Filter by region (EU, US, Global)
- `category` - Filter by category
- `optout_difficulty` - Filter by difficulty (easy, medium, hard)

**Response:**
```json
{
  "success": true,
  "totalBrokers": 150,
  "brokers": [
    {
      "id": "spokeo",
      "name": "Spokeo",
      "website": "spokeo.com",
      "category": "people_search",
      "region": "US",
      "dataCollected": ["name", "address", "phone", "email", "relatives", "social"],
      "sources": ["public_records", "social_media", "marketing_lists"],
      "optOut": {
        "available": true,
        "url": "https://spokeo.com/optout",
        "difficulty": "easy",
        "gdprCompliant": false
      },
      "riskLevel": "high",
      "description": "Aggregiert öffentliche Daten für Personensuche"
    }
  ],
  "categories": [
    {"id": "people_search", "name": "Personensuche", "count": 45},
    {"id": "marketing_data", "name": "Marketing-Daten", "count": 38},
    {"id": "background_check", "name": "Hintergrund-Checks", "count": 25},
    {"id": "credit_reporting", "name": "Kredit-Auskunft", "count": 15},
    {"id": "recruitment", "name": "Recruiting", "count": 12},
    {"id": "insurance", "name": "Versicherung", "count": 10},
    {"id": "government", "name": "Behörden", "count": 5}
  ]
}
```

---

### 8. GET `/api/v2/footprint/breach-database`

Liefert Informationen über bekannte Datenlecks.

**Query Parameters:**
- `search` - Suche nach Breach-Name
- `year` - Filter nach Jahr
- `severity` - Filter nach Schweregrad
- `limit` - Anzahl Ergebnisse (default: 50)

**Response:**
```json
{
  "success": true,
  "totalBreaches": 750,
  "breaches": [
    {
      "id": "linkedin_2021",
      "name": "LinkedIn",
      "domain": "linkedin.com",
      "date": "2021-06-22",
      "addedDate": "2021-06-29",
      "compromisedAccounts": 700000000,
      "dataClasses": ["email", "password", "name", "phone", "workplace"],
      "description": "Massive Datenpanne durch API-Scraping...",
      "severity": "high",
      "isVerified": true,
      "isSensitive": false,
      "affectedCountries": ["Global"],
      "logoUrl": "https://api.achtung.live/logos/linkedin.png"
    }
  ],
  "stats": {
    "totalCompromisedAccounts": 12500000000,
    "breachesByYear": {
      "2024": 45,
      "2023": 120,
      "2022": 98,
      "2021": 87
    },
    "topDataClasses": [
      {"type": "email", "count": 720},
      {"type": "password", "count": 650},
      {"type": "name", "count": 580}
    ]
  }
}
```

---

### 9. POST `/api/v2/footprint/monitor`

Richtet Monitoring für zukünftige Datenlecks ein.

**Request:**
```json
{
  "email": "user@example.com",
  "notifyEmail": "alerts@example.com",
  "options": {
    "breachAlerts": true,
    "darkWebMonitoring": true,
    "socialMentions": true,
    "databrokerAlerts": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "monitorId": "mon_abc123",
  "email": "u***@example.com",
  "status": "active",
  "features": {
    "breachAlerts": true,
    "darkWebMonitoring": true,
    "socialMentions": true,
    "databrokerAlerts": true
  },
  "verificationRequired": true,
  "verificationSentTo": "a***@example.com"
}
```

---

## Datenmodelle

### BreachInfo
```typescript
interface BreachInfo {
  id: string;
  name: string;
  domain: string;
  date: string;
  compromisedAccounts: number;
  dataClasses: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isVerified: boolean;
  isSensitive: boolean;
  logoUrl?: string;
}
```

### DataBroker
```typescript
interface DataBroker {
  id: string;
  name: string;
  website: string;
  category: 'people_search' | 'marketing_data' | 'background_check' |
            'credit_reporting' | 'recruitment' | 'insurance' | 'government';
  region: 'US' | 'EU' | 'Global';
  dataCollected: string[];
  optOut: {
    available: boolean;
    url: string;
    method: 'web_form' | 'email' | 'mail' | 'phone';
    difficulty: 'easy' | 'medium' | 'hard';
    requiresId: boolean;
    estimatedDays: number;
    gdprCompliant: boolean;
  };
  riskLevel: 'low' | 'medium' | 'high';
}
```

### SocialProfile
```typescript
interface SocialProfile {
  platform: string;
  displayName: string;
  found: boolean;
  url?: string;
  username?: string;
  isPublic: boolean;
  publicData: Record<string, any>;
  privacyScore: number;
  privacyIssues: string[];
  recommendations: string[];
}
```

### FootprintScanResult
```typescript
interface FootprintScanResult {
  scanId: string;
  timestamp: string;
  summary: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    totalExposures: number;
    criticalFindings: number;
    actionRequired: number;
  };
  breaches: BreachResult;
  pastebins: PastebinResult;
  socialMedia: SocialMediaResult;
  dataBrokers: DataBrokerResult;
  searchEngines: SearchEngineResult;
  darkWeb: DarkWebResult;
  recommendations: RecommendationSet;
}
```

---

## Sicherheitsanforderungen

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/footprint/scan` | 5 | pro Stunde |
| `/footprint/breach-check` | 20 | pro Minute |
| `/footprint/social-scan` | 10 | pro Minute |
| `/footprint/databroker-scan` | 5 | pro Minute |
| `/footprint/optout-request` | 10 | pro Stunde |

### Datenschutz
- **Keine Speicherung** von Suchanfragen oder Ergebnissen
- **Anonymisierung** in Logs (nur Hash der Email)
- **HTTPS** für alle Anfragen
- **Email-Maskierung** in Responses (u***@example.com)
- **DSGVO-konform**: Daten werden nach Scan gelöscht

### Externe Dienste (falls genutzt)
- Have I Been Pwned API (für Breach-Checks)
- Hunter.io (für Email-Verifizierung)
- Custom Scraping (für Social Media Checks)
- Dark Web Monitoring Services

---

## Implementierungshinweise

### Priorität 1 - Core Features
1. Breach-Check Endpoint (eigene DB + HIBP-Style)
2. Data Broker Datenbank (150+ Broker)
3. Opt-out Anleitungen

### Priorität 2 - Enhanced Features
1. Social Media Scanner
2. Automatisierte Opt-outs
3. Search Engine Results

### Priorität 3 - Premium Features
1. Dark Web Monitoring
2. Kontinuierliches Monitoring
3. Automated Opt-out Service

---

## Beispiel-Datenbanken

### Breach Database (Auszug)
```json
[
  {
    "id": "linkedin_2021",
    "name": "LinkedIn",
    "compromisedAccounts": 700000000,
    "dataClasses": ["email", "name", "phone", "workplace"]
  },
  {
    "id": "facebook_2019",
    "name": "Facebook",
    "compromisedAccounts": 533000000,
    "dataClasses": ["email", "phone", "name", "location"]
  },
  {
    "id": "twitter_2023",
    "name": "Twitter",
    "compromisedAccounts": 200000000,
    "dataClasses": ["email", "name", "username"]
  }
]
```

### Data Broker Database (Auszug - 50 Einträge)
```json
[
  {"id": "spokeo", "name": "Spokeo", "category": "people_search", "region": "US"},
  {"id": "beenverified", "name": "BeenVerified", "category": "background_check", "region": "US"},
  {"id": "whitepages", "name": "Whitepages", "category": "people_search", "region": "US"},
  {"id": "intelius", "name": "Intelius", "category": "people_search", "region": "US"},
  {"id": "acxiom", "name": "Acxiom", "category": "marketing_data", "region": "Global"},
  {"id": "oracle_datacloud", "name": "Oracle Data Cloud", "category": "marketing_data", "region": "Global"},
  {"id": "experian", "name": "Experian", "category": "credit_reporting", "region": "Global"},
  {"id": "equifax", "name": "Equifax", "category": "credit_reporting", "region": "Global"},
  {"id": "lexisnexis", "name": "LexisNexis", "category": "background_check", "region": "Global"},
  {"id": "peoplelooker", "name": "PeopleLooker", "category": "people_search", "region": "US"}
]
```

---

## Version History

| Version | Datum | Änderungen |
|---------|-------|------------|
| 7.0.0 | TBD | Initial Release - Digital Footprint Scanner |

---

## Zusammenfassung der neuen Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/v2/footprint/scan` | Vollständiger Footprint Scan |
| POST | `/api/v2/footprint/breach-check` | Schneller Breach-Check |
| POST | `/api/v2/footprint/social-scan` | Social Media Profil-Scan |
| POST | `/api/v2/footprint/databroker-scan` | Data Broker Scan |
| POST | `/api/v2/footprint/optout-request` | Automatisierter Opt-out |
| GET | `/api/v2/footprint/optout-status/{id}` | Opt-out Status |
| GET | `/api/v2/footprint/databrokers` | Data Broker Datenbank |
| GET | `/api/v2/footprint/breach-database` | Breach Datenbank |
| POST | `/api/v2/footprint/monitor` | Monitoring einrichten |
