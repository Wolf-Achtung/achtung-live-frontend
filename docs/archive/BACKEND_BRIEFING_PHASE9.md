# Backend Briefing: Phase 9 - Data Breach Alerts

## Übersicht

Phase 9 implementiert ein **Echtzeit-Benachrichtigungssystem für Datenlecks**. Nutzer können ihre E-Mail-Adressen registrieren und werden automatisch benachrichtigt, wenn diese in neuen Datenlecks auftauchen.

**Version:** 9.0.0

## Neue API-Endpoints

### 1. POST `/api/v2/alerts/subscribe`

Registriert eine E-Mail für Breach-Monitoring.

**Request:**
```json
{
  "email": "user@example.com",
  "notificationPreferences": {
    "instant": true,
    "weekly_digest": false,
    "severity_threshold": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_abc123",
  "email": "user@example.com",
  "status": "pending_verification",
  "message": "Bestätigungs-E-Mail wurde gesendet",
  "verificationRequired": true
}
```

### 2. GET `/api/v2/alerts/verify/:token`

Bestätigt die E-Mail-Adresse für das Monitoring.

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "status": "active",
  "message": "E-Mail erfolgreich verifiziert. Monitoring ist jetzt aktiv."
}
```

### 3. GET `/api/v2/alerts/status/:email`

Prüft den Monitoring-Status einer E-Mail.

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "status": "active",
  "subscribedAt": "2024-01-15T10:30:00Z",
  "lastChecked": "2024-01-20T14:00:00Z",
  "breachesFound": 3,
  "notificationPreferences": {
    "instant": true,
    "weekly_digest": false,
    "severity_threshold": "medium"
  }
}
```

### 4. DELETE `/api/v2/alerts/unsubscribe/:subscriptionId`

Beendet das Monitoring für eine E-Mail.

**Response:**
```json
{
  "success": true,
  "message": "Monitoring wurde deaktiviert"
}
```

### 5. GET `/api/v2/alerts/history/:email`

Ruft die Breach-Historie für eine registrierte E-Mail ab.

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "totalBreaches": 5,
  "breaches": [
    {
      "id": "breach_001",
      "name": "ExampleService",
      "date": "2024-01-10",
      "discoveredAt": "2024-01-12T08:00:00Z",
      "notifiedAt": "2024-01-12T08:05:00Z",
      "severity": "high",
      "dataTypes": ["email", "password", "name"],
      "description": "Datenbank-Leak durch SQL-Injection",
      "affectedUsers": 1500000,
      "recommendations": [
        "Passwort sofort ändern",
        "2FA aktivieren",
        "Kreditkarten-Aktivität prüfen"
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 5
  }
}
```

### 6. GET `/api/v2/alerts/recent-breaches`

Listet die neuesten öffentlich bekannten Datenlecks.

**Response:**
```json
{
  "success": true,
  "breaches": [
    {
      "id": "breach_recent_001",
      "name": "MajorRetailer",
      "date": "2024-01-18",
      "severity": "critical",
      "affectedUsers": 5000000,
      "dataTypes": ["email", "credit_card", "address"],
      "icon": "🛒",
      "category": "retail"
    }
  ],
  "lastUpdated": "2024-01-20T12:00:00Z"
}
```

### 7. POST `/api/v2/alerts/preferences`

Aktualisiert die Benachrichtigungs-Einstellungen.

**Request:**
```json
{
  "subscriptionId": "sub_abc123",
  "preferences": {
    "instant": true,
    "weekly_digest": true,
    "severity_threshold": "low",
    "language": "de"
  }
}
```

## Datenstrukturen

### Severity Levels
```javascript
const SEVERITY_LEVELS = {
  critical: { score: 4, label: 'Kritisch', color: '#d32f2f', icon: '🚨' },
  high: { score: 3, label: 'Hoch', color: '#f57c00', icon: '⚠️' },
  medium: { score: 2, label: 'Mittel', color: '#fbc02d', icon: '⚡' },
  low: { score: 1, label: 'Niedrig', color: '#388e3c', icon: 'ℹ️' }
};
```

### Data Types
```javascript
const DATA_TYPES = {
  email: { label: 'E-Mail', icon: '📧', risk: 'medium' },
  password: { label: 'Passwort', icon: '🔑', risk: 'critical' },
  password_hash: { label: 'Passwort-Hash', icon: '🔐', risk: 'high' },
  credit_card: { label: 'Kreditkarte', icon: '💳', risk: 'critical' },
  phone: { label: 'Telefon', icon: '📱', risk: 'medium' },
  address: { label: 'Adresse', icon: '🏠', risk: 'high' },
  ssn: { label: 'Sozialvers.-Nr.', icon: '🆔', risk: 'critical' },
  dob: { label: 'Geburtsdatum', icon: '🎂', risk: 'medium' },
  ip_address: { label: 'IP-Adresse', icon: '🌐', risk: 'low' },
  username: { label: 'Benutzername', icon: '👤', risk: 'low' }
};
```

## E-Mail Templates

### Verification Email
```
Betreff: Bestätige dein achtung.live Breach-Monitoring

Hallo,

du hast dich für das Datenleck-Monitoring bei achtung.live registriert.

Klicke hier um deine E-Mail zu bestätigen:
[VERIFICATION_LINK]

Falls du dich nicht registriert hast, ignoriere diese E-Mail.

Dein achtung.live Team
```

### Breach Alert Email
```
Betreff: 🚨 Datenleck-Warnung: [BREACH_NAME]

Hallo,

deine E-Mail-Adresse wurde in einem neuen Datenleck gefunden:

📛 Dienst: [BREACH_NAME]
📅 Datum: [BREACH_DATE]
⚠️ Schweregrad: [SEVERITY]
📊 Betroffene Daten: [DATA_TYPES]

🔒 Empfohlene Maßnahmen:
[RECOMMENDATIONS]

Prüfe deinen Status: [DASHBOARD_LINK]

Dein achtung.live Team
```

## Integration mit Phase 7

Phase 9 erweitert den Footprint Scanner (Phase 7):
- Breach-Check nutzt dieselbe Datenquelle
- "Monitoring aktivieren" Button bei gefundenen Breaches
- Automatische Subscription bei Footprint-Scan (optional)

## Technische Anforderungen

1. **Datenbank:**
   - `subscriptions` Tabelle für E-Mail-Monitoring
   - `breach_notifications` für gesendete Alerts
   - `breach_database` für bekannte Leaks

2. **Background Jobs:**
   - Stündlicher Check gegen neue Breaches
   - Täglicher Digest-Versand
   - Cleanup abgelaufener Tokens

3. **Rate Limiting:**
   - Max 5 Subscriptions pro IP/Tag
   - Max 10 Status-Checks pro Minute

4. **Security:**
   - Double-Opt-In für E-Mail-Verifizierung
   - Verschlüsselte E-Mail-Speicherung
   - Secure Unsubscribe-Tokens
