# Backend Briefing: Phase 3 - Real-Time Checking & Optimierungen

## Übersicht

Phase 3 des Frontends führt **Real-Time Checking** ein - eine Live-Prüfung während des Tippens. Dies erfordert Backend-Optimierungen für schnellere Antwortzeiten und effiziente Ressourcennutzung.

---

## 1. Quick Check Endpoint

### Anforderung

Das Frontend sendet bei Real-Time Checking:
```json
{
  "text": "Beispieltext...",
  "context": "private",
  "options": {
    "quickCheck": true
  }
}
```

### Gewünschtes Verhalten

Wenn `options.quickCheck === true`:
- **Nur Regex-basierte Erkennung** (kein GPT/Claude Call)
- **Ziel-Latenz: < 200ms** (statt 1-2s bei vollständiger Analyse)
- **Reduzierter Response** (nur erkannte Kategorien, kein Rewrite)

### Implementierung im Backend

```javascript
// In /api/v2/analyze Handler

async function analyzeText(text, context, options = {}) {
  // Quick Check Mode: Nur Regex, kein LLM
  if (options.quickCheck) {
    return quickCheckAnalysis(text, context);
  }

  // Vollständige Analyse mit LLM
  return fullAnalysis(text, context, options);
}

function quickCheckAnalysis(text, context) {
  const startTime = Date.now();
  const categories = [];

  // Regex Patterns anwenden
  for (const [type, pattern] of Object.entries(DETECTION_PATTERNS)) {
    const matches = text.match(pattern.regex);
    if (matches) {
      matches.forEach(match => {
        categories.push({
          type: type,
          severity: pattern.severity,
          match: match,
          message: pattern.message,
          position: {
            start: text.indexOf(match),
            end: text.indexOf(match) + match.length
          }
        });
      });
    }
  }

  // Risk Score berechnen
  const riskScore = calculateRiskScore(categories);

  return {
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    categories,
    summary: `${categories.length} potenzielle Risiken erkannt`,
    meta: {
      mode: 'quickCheck',
      processingTime: Date.now() - startTime,
      patternsChecked: Object.keys(DETECTION_PATTERNS).length
    }
  };
}
```

---

## 2. Erweiterte Regex Patterns

### Pattern-Definitionen

```javascript
const DETECTION_PATTERNS = {
  // === FINANZEN ===
  iban: {
    regex: /\b[A-Z]{2}\d{2}[\s]?(?:\d{4}[\s]?){4,7}\d{0,2}\b/gi,
    severity: 'critical',
    message: 'IBAN-Nummer erkannt - Bankdaten niemals öffentlich teilen'
  },

  credit_card: {
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    severity: 'critical',
    message: 'Kreditkartennummer erkannt'
  },

  bic: {
    regex: /\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/g,
    severity: 'high',
    message: 'BIC/SWIFT-Code erkannt'
  },

  // === IDENTIFIKATION ===
  german_id: {
    regex: /\b[CFGHJKLMNPRTVWXYZ0-9]{9}\b/g,
    severity: 'critical',
    message: 'Mögliche Personalausweisnummer erkannt'
  },

  tax_id: {
    regex: /\b\d{2}\s?\d{3}\s?\d{5}\b/g,
    severity: 'critical',
    message: 'Steuer-ID erkannt'
  },

  social_security: {
    regex: /\b\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}\b/gi,
    severity: 'critical',
    message: 'Sozialversicherungsnummer erkannt'
  },

  // === KONTAKT ===
  phone: {
    regex: /(?:\+49|0049|0)[\s.-]?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,}[\s.-]?\d{2,}/g,
    severity: 'medium',
    message: 'Telefonnummer erkannt'
  },

  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'medium',
    message: 'E-Mail-Adresse erkannt'
  },

  address: {
    regex: /\b(?:Straße|Str\.|Weg|Platz|Allee|Gasse|Ring)\s+\d+[a-z]?\b/gi,
    severity: 'medium',
    message: 'Straßenadresse erkannt'
  },

  postal_code: {
    regex: /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?\b/g,
    severity: 'low',
    message: 'Postleitzahl mit Ort erkannt'
  },

  // === DIGITAL ===
  ip_address: {
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    severity: 'medium',
    message: 'IP-Adresse erkannt'
  },

  mac_address: {
    regex: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g,
    severity: 'low',
    message: 'MAC-Adresse erkannt'
  },

  password_hint: {
    regex: /(?:passwort|kennwort|password|pin|geheim)[\s:]+\S+/gi,
    severity: 'critical',
    message: 'Mögliches Passwort erkannt'
  },

  api_key: {
    regex: /\b(?:api[_-]?key|secret|token)[\s:=]+['"]?[A-Za-z0-9_-]{20,}['"]?/gi,
    severity: 'critical',
    message: 'API-Schlüssel oder Token erkannt'
  },

  // === PERSÖNLICH ===
  date_of_birth: {
    regex: /\b(?:geboren|geb\.|geburtstag|birthday)[\s:]+\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}\b/gi,
    severity: 'medium',
    message: 'Geburtsdatum erkannt'
  },

  german_date: {
    regex: /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g,
    severity: 'low',
    message: 'Datum erkannt'
  },

  // === FAHRZEUG ===
  license_plate: {
    regex: /\b[A-ZÄÖÜ]{1,3}[\s-]?[A-Z]{1,2}[\s-]?\d{1,4}[EH]?\b/g,
    severity: 'medium',
    message: 'Kfz-Kennzeichen erkannt'
  },

  // === GESUNDHEIT ===
  health_insurance: {
    regex: /\b[A-Z]\d{9}\b/g,
    severity: 'high',
    message: 'Krankenversicherungsnummer erkannt'
  },

  // === STANDORT/KONTEXT ===
  vacation_hint: {
    regex: /(?:urlaub|verreist|nicht\s+(?:zu\s+)?hause|weg\s+(?:vom|von)|abwesend|unterwegs\s+nach)/gi,
    severity: 'medium',
    message: 'Abwesenheitshinweis erkannt - Einbrecher könnten dies nutzen'
  },

  gps_coordinates: {
    regex: /\b-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}\b/g,
    severity: 'high',
    message: 'GPS-Koordinaten erkannt'
  }
};
```

---

## 3. Rate Limiting

### Empfohlene Limits

```javascript
const RATE_LIMITS = {
  // Vollständige Analyse
  fullAnalysis: {
    windowMs: 60 * 1000,  // 1 Minute
    max: 10,              // 10 Requests pro Minute
    message: 'Zu viele Analyse-Anfragen. Bitte warte einen Moment.'
  },

  // Quick Check (Real-Time)
  quickCheck: {
    windowMs: 60 * 1000,  // 1 Minute
    max: 60,              // 60 Requests pro Minute (1/Sekunde)
    message: 'Rate Limit erreicht für Live-Prüfung.'
  },

  // Batch Analyse
  batchAnalysis: {
    windowMs: 60 * 1000,
    max: 5,
    message: 'Zu viele Batch-Anfragen.'
  }
};
```

### Express Middleware Beispiel

```javascript
const rateLimit = require('express-rate-limit');

// Quick Check Limiter
const quickCheckLimiter = rateLimit({
  windowMs: RATE_LIMITS.quickCheck.windowMs,
  max: RATE_LIMITS.quickCheck.max,
  message: { error: RATE_LIMITS.quickCheck.message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.body?.options?.quickCheck
});

// Full Analysis Limiter
const fullAnalysisLimiter = rateLimit({
  windowMs: RATE_LIMITS.fullAnalysis.windowMs,
  max: RATE_LIMITS.fullAnalysis.max,
  message: { error: RATE_LIMITS.fullAnalysis.message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.body?.options?.quickCheck
});

app.post('/api/v2/analyze', quickCheckLimiter, fullAnalysisLimiter, analyzeHandler);
```

---

## 4. Response Caching (Optional)

### In-Memory Cache für Quick Checks

```javascript
const NodeCache = require('node-cache');

// Cache mit 5 Minuten TTL
const quickCheckCache = new NodeCache({
  stdTTL: 300,        // 5 Minuten
  checkperiod: 60,    // Cleanup alle 60s
  maxKeys: 1000       // Max 1000 Einträge
});

function getCacheKey(text, context) {
  const crypto = require('crypto');
  return crypto.createHash('md5')
    .update(text + context)
    .digest('hex');
}

async function analyzeWithCache(text, context, options) {
  if (options.quickCheck) {
    const cacheKey = getCacheKey(text, context);
    const cached = quickCheckCache.get(cacheKey);

    if (cached) {
      return { ...cached, meta: { ...cached.meta, cached: true } };
    }

    const result = await quickCheckAnalysis(text, context);
    quickCheckCache.set(cacheKey, result);
    return result;
  }

  return fullAnalysis(text, context, options);
}
```

---

## 5. API Response Format

### Quick Check Response

```json
{
  "riskScore": 65,
  "riskLevel": "warning",
  "categories": [
    {
      "type": "phone",
      "severity": "medium",
      "match": "+49 170 1234567",
      "message": "Telefonnummer erkannt",
      "position": { "start": 45, "end": 61 }
    },
    {
      "type": "email",
      "severity": "medium",
      "match": "max@example.de",
      "message": "E-Mail-Adresse erkannt",
      "position": { "start": 78, "end": 92 }
    }
  ],
  "summary": "2 potenzielle Risiken erkannt",
  "meta": {
    "mode": "quickCheck",
    "processingTime": 12,
    "patternsChecked": 22,
    "cached": false
  }
}
```

### Unterschied zur vollständigen Analyse

| Feature | Quick Check | Full Analysis |
|---------|------------|---------------|
| Latenz | < 200ms | 1-3s |
| Regex Patterns | ✓ | ✓ |
| LLM Analyse | ✗ | ✓ |
| Semantische Erkennung | ✗ | ✓ |
| Rewrite Suggestion | ✗ | ✓ |
| Context Awareness | Basis | Erweitert |

---

## 6. Neuer Endpoint: GET /api/v2/patterns

Optional: Endpoint zum Abrufen der aktiven Pattern-Liste (für Debugging/Transparenz).

```javascript
app.get('/api/v2/patterns', (req, res) => {
  const patterns = Object.entries(DETECTION_PATTERNS).map(([type, config]) => ({
    type,
    severity: config.severity,
    message: config.message,
    // Regex nicht exposen (Sicherheit)
  }));

  res.json({
    version: '3.0',
    patternCount: patterns.length,
    patterns
  });
});
```

---

## 7. Health Check Erweiterung

Erweitere `/api/v2/health` um Quick Check Status:

```json
{
  "status": "healthy",
  "version": "3.0.0",
  "providers": {
    "openai": { "status": "ok", "model": "gpt-4" },
    "anthropic": { "status": "ok", "model": "claude-sonnet-4-5-20250929" }
  },
  "quickCheck": {
    "enabled": true,
    "patternsLoaded": 22,
    "cacheSize": 145,
    "cacheHitRate": "78%"
  },
  "rateLimits": {
    "quickCheck": "60/min",
    "fullAnalysis": "10/min"
  }
}
```

---

## 8. Zusammenfassung der Backend-Änderungen

### Erforderlich (Priorität 1)
- [ ] `options.quickCheck` Parameter unterstützen
- [ ] Regex-only Analyse implementieren
- [ ] Response-Format anpassen (mode: 'quickCheck')

### Empfohlen (Priorität 2)
- [ ] Rate Limiting differenziert nach Modus
- [ ] Erweiterte Regex Patterns (22+ Kategorien)
- [ ] Processing Time in Meta-Daten

### Optional (Priorität 3)
- [ ] Response Caching für Quick Checks
- [ ] GET /api/v2/patterns Endpoint
- [ ] Health Check Erweiterung

---

## 9. Test-Szenarien

```bash
# Quick Check Test
curl -X POST https://your-backend/api/v2/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Meine IBAN ist DE89370400440532013000 und meine Nummer +49 170 1234567",
    "context": "private",
    "options": { "quickCheck": true }
  }'

# Erwartete Antwort (< 200ms):
# - 2 Kategorien (iban, phone)
# - meta.mode = "quickCheck"
# - meta.processingTime < 200

# Vollständige Analyse (zum Vergleich)
curl -X POST https://your-backend/api/v2/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Meine IBAN ist DE89370400440532013000 und meine Nummer +49 170 1234567",
    "context": "private"
  }'

# Erwartete Antwort (1-3s):
# - Mehr Details
# - Semantische Analyse
# - Rewrite Suggestion
```

---

## 10. Frontend-Integration bereits fertig

Das Frontend sendet bereits:
```javascript
fetch(API_ANALYZE_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: text,
    context: document.getElementById('contextSelect').value,
    options: { quickCheck: true }  // ← Bereits implementiert
  })
});
```

Nach Backend-Update wird Real-Time Checking automatisch schneller.
