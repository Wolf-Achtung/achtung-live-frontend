# Backend Briefing: Phase 4 - Multi-Language, Document Analysis & PWA

## Übersicht

Phase 4 erweitert achtung.live um drei große Feature-Bereiche:
- **C: Multi-Language** - Internationalisierung (DE, EN, FR, ES, IT)
- **D: Extended Analysis** - Bild-OCR, PDF-Analyse, Sentiment
- **F: Mobile/PWA** - Offline-fähige Progressive Web App

---

## Teil C: Multi-Language Support

### 1. Sprach-Parameter in API Requests

Alle Endpoints sollten einen optionalen `lang` Parameter akzeptieren:

```javascript
// Request
{
  "text": "My IBAN is GB82WEST12345698765432",
  "context": "email",
  "lang": "en",  // de, en, fr, es, it
  "options": { "quickCheck": true }
}
```

### 2. Lokalisierte Responses

```javascript
// Response mit lang: "en"
{
  "riskScore": 35,
  "riskLevel": "danger",
  "categories": [
    {
      "type": "iban",
      "severity": "critical",
      "match": "GB82WEST12345698765432",
      "message": "IBAN detected - Never share bank details publicly",
      "suggestion": "Use secure channels for financial information"
    }
  ],
  "summary": "1 critical risk detected",
  "meta": {
    "lang": "en",
    "mode": "quickCheck"
  }
}
```

### 3. Übersetzungs-Dateien im Backend

```javascript
// /locales/de.json
{
  "categories": {
    "iban": {
      "label": "IBAN/Bankdaten",
      "message": "IBAN-Nummer erkannt - Bankdaten niemals öffentlich teilen",
      "suggestion": "Nutze sichere Kanäle für Finanzinformationen"
    },
    "phone": {
      "label": "Telefonnummer",
      "message": "Telefonnummer erkannt",
      "suggestion": "Überlege, ob die Nummer wirklich geteilt werden muss"
    }
    // ... weitere Kategorien
  },
  "summary": {
    "noRisks": "Keine Risiken erkannt",
    "oneRisk": "1 Risiko erkannt",
    "multipleRisks": "{count} Risiken erkannt"
  },
  "riskLevels": {
    "safe": "Sicher",
    "warning": "Achtung",
    "danger": "Gefahr"
  }
}

// /locales/en.json
{
  "categories": {
    "iban": {
      "label": "IBAN/Bank Details",
      "message": "IBAN detected - Never share bank details publicly",
      "suggestion": "Use secure channels for financial information"
    },
    "phone": {
      "label": "Phone Number",
      "message": "Phone number detected",
      "suggestion": "Consider if this number really needs to be shared"
    }
  },
  "summary": {
    "noRisks": "No risks detected",
    "oneRisk": "1 risk detected",
    "multipleRisks": "{count} risks detected"
  },
  "riskLevels": {
    "safe": "Safe",
    "warning": "Warning",
    "danger": "Danger"
  }
}

// /locales/fr.json, /locales/es.json, /locales/it.json ...
```

### 4. Sprach-spezifische Regex Patterns

Manche Patterns sind länderspezifisch:

```javascript
const COUNTRY_PATTERNS = {
  de: {
    phone: /(?:\+49|0049|0)[\s.-]?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,}[\s.-]?\d{2,}/g,
    postal_code: /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/g,
    national_id: /\b[CFGHJKLMNPRTVWXYZ0-9]{9}\b/g
  },
  en: {
    phone: /(?:\+1|1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    postal_code: /\b\d{5}(?:-\d{4})?\b/g,  // US ZIP
    national_id: /\b\d{3}-\d{2}-\d{4}\b/g   // SSN
  },
  fr: {
    phone: /(?:\+33|0033|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}/g,
    postal_code: /\b\d{5}\s+[A-Z][a-zéèêëàâäùûüôöîï]+/g
  },
  // ... weitere Länder
};
```

### 5. Neuer Endpoint: GET /api/v2/languages

```javascript
app.get('/api/v2/languages', (req, res) => {
  res.json({
    available: ['de', 'en', 'fr', 'es', 'it'],
    default: 'de',
    labels: {
      de: 'Deutsch',
      en: 'English',
      fr: 'Français',
      es: 'Español',
      it: 'Italiano'
    }
  });
});
```

---

## Teil D: Extended Analysis (OCR, PDF, Sentiment)

### 1. Neuer Endpoint: POST /api/v2/analyze/document

```javascript
// Request (multipart/form-data)
{
  "file": <binary>,           // Bild (PNG, JPG, WEBP) oder PDF
  "lang": "de",               // Sprache für OCR
  "context": "private",
  "options": {
    "ocr": true,              // OCR aktivieren
    "sentiment": true,        // Sentiment-Analyse
    "extractText": true       // Text extrahieren
  }
}
```

### 2. Response Format

```javascript
{
  "riskScore": 45,
  "riskLevel": "warning",
  "categories": [
    {
      "type": "iban",
      "severity": "critical",
      "match": "DE89370400440532013000",
      "message": "IBAN im Dokument erkannt",
      "position": {
        "page": 1,
        "bbox": { "x": 120, "y": 340, "width": 280, "height": 24 }
      }
    }
  ],
  "document": {
    "type": "image/png",
    "pages": 1,
    "extractedText": "Rechnung Nr. 12345\nIBAN: DE89370400440532013000\n...",
    "textLength": 245,
    "ocrConfidence": 0.94
  },
  "sentiment": {
    "score": -0.3,           // -1 (negativ) bis +1 (positiv)
    "label": "neutral",      // positive, neutral, negative
    "emotions": {
      "anger": 0.1,
      "frustration": 0.2,
      "neutral": 0.7
    }
  },
  "meta": {
    "processingTime": 2340,
    "ocrEngine": "tesseract",
    "sentimentModel": "multilingual-sentiment"
  }
}
```

### 3. OCR Implementation

```javascript
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const sharp = require('sharp');

async function extractTextFromDocument(file, lang = 'deu') {
  const mimeType = file.mimetype;

  // Bild-Dateien (PNG, JPG, WEBP)
  if (mimeType.startsWith('image/')) {
    // Bild optimieren für bessere OCR
    const optimizedBuffer = await sharp(file.buffer)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const { data } = await Tesseract.recognize(optimizedBuffer, lang, {
      logger: m => console.log(m)
    });

    return {
      text: data.text,
      confidence: data.confidence / 100,
      words: data.words.map(w => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox
      }))
    };
  }

  // PDF-Dateien
  if (mimeType === 'application/pdf') {
    const data = await pdf(file.buffer);
    return {
      text: data.text,
      confidence: 1.0,  // Native PDF text
      pages: data.numpages
    };
  }

  throw new Error('Unsupported file type');
}

// Tesseract Sprach-Mapping
const OCR_LANG_MAP = {
  de: 'deu',
  en: 'eng',
  fr: 'fra',
  es: 'spa',
  it: 'ita'
};
```

### 4. Sentiment Analysis

```javascript
const Sentiment = require('sentiment');
// Oder: Hugging Face Inference API für bessere Multilingual-Unterstützung

async function analyzeSentiment(text, lang = 'de') {
  // Option 1: Lokale Library (schnell, weniger genau)
  if (lang === 'en') {
    const sentiment = new Sentiment();
    const result = sentiment.analyze(text);
    return {
      score: result.comparative,  // -5 bis +5, normalisiert auf -1 bis +1
      label: result.comparative > 0.1 ? 'positive' :
             result.comparative < -0.1 ? 'negative' : 'neutral'
    };
  }

  // Option 2: Hugging Face API (besser für Deutsch/Multilingual)
  const response = await fetch('https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: text })
  });

  const result = await response.json();
  // Konvertiere 1-5 Sterne zu -1 bis +1
  const stars = parseFloat(result[0][0].label.split(' ')[0]);
  return {
    score: (stars - 3) / 2,
    label: stars >= 4 ? 'positive' : stars <= 2 ? 'negative' : 'neutral'
  };
}
```

### 5. Unterstützte Dateiformate

```javascript
const SUPPORTED_FORMATS = {
  image: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxSize: 10 * 1024 * 1024,  // 10 MB
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif']
  },
  document: {
    mimeTypes: ['application/pdf'],
    maxSize: 25 * 1024 * 1024,  // 25 MB
    extensions: ['.pdf']
  }
};

// Validierung
function validateFile(file) {
  const allMimeTypes = [
    ...SUPPORTED_FORMATS.image.mimeTypes,
    ...SUPPORTED_FORMATS.document.mimeTypes
  ];

  if (!allMimeTypes.includes(file.mimetype)) {
    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  const maxSize = file.mimetype.startsWith('image/')
    ? SUPPORTED_FORMATS.image.maxSize
    : SUPPORTED_FORMATS.document.maxSize;

  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum: ${maxSize / 1024 / 1024} MB`);
  }

  return true;
}
```

### 6. Rate Limits für Document Analysis

```javascript
const RATE_LIMITS = {
  // ... bestehende Limits
  documentAnalysis: {
    windowMs: 60 * 1000,
    max: 5,  // 5 Dokumente pro Minute
    message: 'Zu viele Dokument-Analysen. Bitte warte einen Moment.'
  }
};
```

---

## Teil F: PWA Support

### 1. Erweiterter Health Check für Offline-Detection

```javascript
// GET /api/v2/health - Minimale Response für Offline-Check
app.get('/api/v2/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

### 2. Offline-fähige Quick Check Patterns

Endpoint um Patterns für Offline-Nutzung zu laden:

```javascript
// GET /api/v2/patterns/offline
app.get('/api/v2/patterns/offline', (req, res) => {
  const lang = req.query.lang || 'de';

  res.json({
    version: '4.0.0',
    lang,
    patterns: DETECTION_PATTERNS,  // Alle Regex Patterns
    messages: LOCALES[lang],       // Lokalisierte Messages
    lastUpdated: new Date().toISOString()
  });
});
```

### 3. Push Notification Support (Optional)

```javascript
const webpush = require('web-push');

// VAPID Keys generieren (einmalig)
// const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:info@achtung.live',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// POST /api/v2/subscribe - Push-Subscription speichern
app.post('/api/v2/subscribe', async (req, res) => {
  const subscription = req.body;
  // Speichere Subscription in DB
  await saveSubscription(subscription);
  res.json({ success: true });
});

// Push senden (z.B. bei neuen Sicherheitswarnungen)
async function sendPushNotification(subscription, payload) {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
```

---

## Neue Environment Variables

```bash
# OCR
TESSERACT_LANG_PATH=/usr/share/tesseract-ocr/tessdata

# Sentiment Analysis (Optional - Hugging Face)
HUGGINGFACE_API_KEY=hf_xxxxx

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Neue Dependencies (Backend)

```json
{
  "dependencies": {
    "tesseract.js": "^5.0.0",
    "pdf-parse": "^1.1.1",
    "sharp": "^0.33.0",
    "sentiment": "^5.0.2",
    "web-push": "^3.6.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

---

## API Übersicht Phase 4

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/v2/languages` | GET | Verfügbare Sprachen |
| `/api/v2/analyze` | POST | + `lang` Parameter |
| `/api/v2/analyze/document` | POST | OCR/PDF Analyse |
| `/api/v2/patterns/offline` | GET | Patterns für PWA |
| `/api/v2/ping` | GET | Minimaler Health Check |
| `/api/v2/subscribe` | POST | Push Subscription |

---

## Test-Szenarien

```bash
# Multi-Language Test
curl -X POST https://backend/api/v2/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "My phone is +1-555-123-4567", "lang": "en"}'

# Document Upload Test
curl -X POST https://backend/api/v2/analyze/document \
  -F "file=@screenshot.png" \
  -F "lang=de" \
  -F "options={\"ocr\":true,\"sentiment\":true}"

# Offline Patterns
curl https://backend/api/v2/patterns/offline?lang=de
```

---

## Prioritäten

### Priorität 1 (Erforderlich)
- [ ] `lang` Parameter in /api/v2/analyze
- [ ] Lokalisierte Messages (DE, EN)
- [ ] GET /api/v2/languages
- [ ] GET /api/v2/ping (für PWA)

### Priorität 2 (Empfohlen)
- [ ] POST /api/v2/analyze/document mit OCR
- [ ] PDF Text-Extraktion
- [ ] GET /api/v2/patterns/offline
- [ ] Weitere Sprachen (FR, ES, IT)

### Priorität 3 (Optional)
- [ ] Sentiment Analysis
- [ ] Push Notifications
- [ ] Länderspezifische Patterns
