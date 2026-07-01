# Backend Briefing: Phase 10 - Smart Privacy Coach

## Übersicht

Phase 10 implementiert einen KI-gestützten Privacy Coach - einen interaktiven Chatbot, der Nutzern personalisierte Datenschutz-Beratung bietet, Fragen beantwortet und durch komplexe Privacy-Themen führt.

**Ziel-Version:** 10.0.0

---

## Neue API-Endpoints

### 1. POST `/api/v2/coach/chat`

Hauptendpoint für Chat-Interaktionen mit dem Privacy Coach.

**Request:**
```json
{
  "sessionId": "session_abc123",
  "message": "Warum ist meine IBAN gefährlich?",
  "context": {
    "previousAnalysis": {
      "text": "Meine IBAN ist DE89370400440532013000",
      "risks": ["iban", "financial"],
      "riskScore": 85
    },
    "userProfile": {
      "privacyLevel": "beginner",
      "language": "de",
      "interests": ["banking", "social_media"]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_abc123",
  "response": {
    "message": "Deine IBAN ist ein sehr sensibler Datenpunkt! Hier ist warum:\n\n**Risiken:**\n1. **Lastschriftbetrug**: Mit deiner IBAN können Betrüger unerlaubte Lastschriften einziehen\n2. **Identitätsdiebstahl**: IBAN + Name reicht oft für Betrug\n3. **Phishing**: Betrüger nutzen echte IBANs für glaubwürdige Fake-Mails\n\n**Was du tun solltest:**\n- IBAN nie öffentlich teilen\n- Kontoauszüge regelmäßig prüfen\n- Bei Verdacht: Bank informieren",
    "messageType": "explanation",
    "confidence": 0.95,
    "sources": [
      {"type": "knowledge_base", "topic": "banking_security"},
      {"type": "bsi", "url": "https://bsi.bund.de/..."}
    ]
  },
  "suggestions": [
    {
      "type": "follow_up",
      "text": "Wie erkenne ich Lastschriftbetrug?",
      "action": "ask"
    },
    {
      "type": "action",
      "text": "Text ohne IBAN umschreiben",
      "action": "rewrite",
      "params": {"removeTypes": ["iban"]}
    },
    {
      "type": "learn_more",
      "text": "Mehr über Bankdaten-Sicherheit",
      "action": "topic",
      "params": {"topic": "banking_security"}
    }
  ],
  "relatedTopics": ["lastschrift", "phishing", "identitaetsdiebstahl"],
  "privacyTip": {
    "icon": "💡",
    "text": "Wusstest du? In Deutschland kannst du unberechtigte Lastschriften 8 Wochen lang zurückbuchen lassen."
  }
}
```

---

### 2. POST `/api/v2/coach/explain`

Erklärt einen spezifischen Datenschutz-Begriff oder Risiko-Typ.

**Request:**
```json
{
  "term": "k-anonymity",
  "complexity": "simple",
  "language": "de",
  "context": "deanonymization"
}
```

**Response:**
```json
{
  "success": true,
  "term": "k-anonymity",
  "explanation": {
    "simple": "k-Anonymität bedeutet: Du bist in einer Gruppe von mindestens k Personen versteckt, die alle gleich aussehen. Je größer k, desto besser versteckt bist du.",
    "detailed": "k-Anonymität ist ein Datenschutz-Konzept...",
    "technical": "Formal: Ein Datensatz erfüllt k-Anonymität, wenn..."
  },
  "examples": [
    {
      "scenario": "k=1 (schlecht)",
      "description": "Du bist der einzige 25-jährige Programmierer in Berlin-Mitte → sofort identifizierbar"
    },
    {
      "scenario": "k=1000 (gut)",
      "description": "Du bist einer von 1000 Personen mit gleichen Merkmalen → gut versteckt"
    }
  ],
  "visualAid": {
    "type": "comparison",
    "data": [
      {"k": 1, "risk": "critical", "icon": "🔴"},
      {"k": 10, "risk": "high", "icon": "🟠"},
      {"k": 100, "risk": "medium", "icon": "🟡"},
      {"k": 1000, "risk": "low", "icon": "🟢"}
    ]
  },
  "relatedTerms": ["l-diversity", "t-closeness", "differential_privacy"],
  "learnMore": {
    "url": "/learn/k-anonymity",
    "videoUrl": "https://youtube.com/..."
  }
}
```

---

### 3. POST `/api/v2/coach/analyze-risk`

Analysiert einen Text und erklärt die Risiken im Konversationsstil.

**Request:**
```json
{
  "text": "Hi, ich bin Max Müller, 28, wohne in der Hauptstraße 15 in 80331 München und arbeite bei BMW.",
  "questionType": "why_risky",
  "detailLevel": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "overallAssessment": "Dieser Text enthält eine gefährliche Kombination von Daten, die dich eindeutig identifizierbar macht.",
    "riskScore": 92,
    "identifiability": "unique",
    "kAnonymity": 1,
    "explanation": "Mit diesen Informationen bist du **weltweit einzigartig identifizierbar**. Es gibt wahrscheinlich nur eine Person namens Max Müller, 28 Jahre, die in der Hauptstraße 15, 80331 München wohnt und bei BMW arbeitet."
  },
  "dataPoints": [
    {
      "type": "full_name",
      "value": "Max Müller",
      "risk": "high",
      "explanation": "Dein vollständiger Name ist ein starker Identifikator",
      "uniquenessContribution": 0.35
    },
    {
      "type": "age",
      "value": "28",
      "risk": "low",
      "explanation": "Alter allein ist nicht kritisch, aber in Kombination...",
      "uniquenessContribution": 0.05
    },
    {
      "type": "address",
      "value": "Hauptstraße 15, 80331 München",
      "risk": "critical",
      "explanation": "Eine vollständige Adresse ist fast so einzigartig wie ein Fingerabdruck",
      "uniquenessContribution": 0.45
    },
    {
      "type": "employer",
      "value": "BMW",
      "risk": "medium",
      "explanation": "Eingrenzt dich auf ~150.000 Mitarbeiter weltweit",
      "uniquenessContribution": 0.15
    }
  ],
  "combinationRisk": {
    "explanation": "Die Kombination dieser Daten ist besonders gefährlich:",
    "calculation": "Name (35%) + Alter (5%) + Adresse (45%) + Arbeitgeber (15%) = 100% identifizierbar",
    "visualFormula": "👤 + 🎂 + 📍 + 🏢 = 🎯 (eindeutig)"
  },
  "realWorldThreats": [
    {
      "threat": "Stalking",
      "description": "Jemand könnte dich physisch aufsuchen",
      "likelihood": "medium"
    },
    {
      "threat": "Spear-Phishing",
      "description": "Gezielte Betrugs-Mails mit deinen echten Daten",
      "likelihood": "high"
    },
    {
      "threat": "Identitätsdiebstahl",
      "description": "Jemand gibt sich als du aus",
      "likelihood": "medium"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "action": "Adresse entfernen",
      "impact": "Reduziert Risiko um 45%",
      "safeAlternative": "Erwähne nur 'München' oder 'Bayern'"
    },
    {
      "priority": 2,
      "action": "Arbeitgeber verallgemeinern",
      "impact": "Reduziert Risiko um 15%",
      "safeAlternative": "'in der Automobilbranche' statt 'bei BMW'"
    }
  ],
  "safeVersion": {
    "text": "Hi, ich bin Max, Ende 20, wohne in München und arbeite in der Automobilbranche.",
    "remainingRisk": 15,
    "improvement": "Risiko von 92% auf 15% reduziert"
  }
}
```

---

### 4. GET `/api/v2/coach/topics`

Liefert verfügbare Lern-Themen für den Privacy Coach.

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "basics",
      "name": "Grundlagen",
      "icon": "📚",
      "topics": [
        {
          "id": "what_is_privacy",
          "title": "Was ist Datenschutz?",
          "description": "Die Grundlagen verstehen",
          "difficulty": "beginner",
          "duration": "5 min",
          "icon": "🔒"
        },
        {
          "id": "gdpr_basics",
          "title": "DSGVO einfach erklärt",
          "description": "Deine Rechte in der EU",
          "difficulty": "beginner",
          "duration": "10 min",
          "icon": "🇪🇺"
        }
      ]
    },
    {
      "id": "data_types",
      "name": "Datentypen",
      "icon": "📊",
      "topics": [
        {
          "id": "pii_explained",
          "title": "Persönliche Daten (PII)",
          "description": "Was sind personenbezogene Daten?",
          "difficulty": "beginner",
          "duration": "7 min",
          "icon": "👤"
        },
        {
          "id": "financial_data",
          "title": "Finanzdaten schützen",
          "description": "IBAN, Kreditkarte & Co",
          "difficulty": "intermediate",
          "duration": "12 min",
          "icon": "💳"
        }
      ]
    },
    {
      "id": "threats",
      "name": "Bedrohungen",
      "icon": "⚠️",
      "topics": [
        {
          "id": "phishing",
          "title": "Phishing erkennen",
          "description": "Betrügerische Nachrichten entlarven",
          "difficulty": "beginner",
          "duration": "8 min",
          "icon": "🎣"
        },
        {
          "id": "identity_theft",
          "title": "Identitätsdiebstahl",
          "description": "Wie Kriminelle deine Identität stehlen",
          "difficulty": "intermediate",
          "duration": "15 min",
          "icon": "🎭"
        },
        {
          "id": "deanonymization",
          "title": "Deanonymisierung",
          "description": "Wie man aus anonymen Daten Personen erkennt",
          "difficulty": "advanced",
          "duration": "20 min",
          "icon": "🔍"
        }
      ]
    },
    {
      "id": "protection",
      "name": "Schutzmaßnahmen",
      "icon": "🛡️",
      "topics": [
        {
          "id": "password_security",
          "title": "Sichere Passwörter",
          "description": "Passwort-Manager und 2FA",
          "difficulty": "beginner",
          "duration": "10 min",
          "icon": "🔑"
        },
        {
          "id": "social_media_privacy",
          "title": "Social Media Einstellungen",
          "description": "Facebook, Instagram & Co absichern",
          "difficulty": "intermediate",
          "duration": "15 min",
          "icon": "📱"
        }
      ]
    }
  ],
  "featuredTopic": {
    "id": "current_threats_2024",
    "title": "Aktuelle Bedrohungen 2024",
    "description": "Die neuesten Betrugsmaschen",
    "badge": "NEU"
  }
}
```

---

### 5. GET `/api/v2/coach/topic/{topicId}`

Liefert detaillierten Inhalt zu einem spezifischen Thema.

**Response:**
```json
{
  "success": true,
  "topic": {
    "id": "phishing",
    "title": "Phishing erkennen",
    "icon": "🎣",
    "difficulty": "beginner",
    "duration": "8 min",
    "lastUpdated": "2024-01-15"
  },
  "content": {
    "introduction": "Phishing ist eine der häufigsten Betrugsmaschen im Internet. Betrüger versuchen, dich mit gefälschten E-Mails oder Websites zur Preisgabe sensibler Daten zu verleiten.",
    "sections": [
      {
        "title": "Was ist Phishing?",
        "content": "Phishing kommt vom englischen 'fishing' (Angeln)...",
        "visualAid": {
          "type": "image",
          "url": "/assets/phishing-example.png",
          "alt": "Beispiel einer Phishing-Mail"
        }
      },
      {
        "title": "Typische Merkmale",
        "content": "So erkennst du Phishing-Versuche:",
        "bulletPoints": [
          "Dringlichkeit: 'Ihr Konto wird gesperrt!'",
          "Rechtschreibfehler und seltsame Formulierungen",
          "Verdächtige Absender-Adressen",
          "Links zu falschen Websites",
          "Aufforderung zur Dateneingabe"
        ]
      },
      {
        "title": "Praxis-Check",
        "type": "interactive",
        "quiz": [
          {
            "question": "Diese Mail behauptet von deiner Bank zu sein. Der Absender ist 'service@sparkasse-sicherheit.com'. Ist das verdächtig?",
            "options": ["Ja, verdächtig", "Nein, sieht legitim aus"],
            "correct": 0,
            "explanation": "Echte Bank-Mails kommen von @sparkasse.de, nicht von Phantasie-Domains!"
          }
        ]
      }
    ],
    "keyTakeaways": [
      "Nie auf Links in verdächtigen Mails klicken",
      "Absender-Adresse genau prüfen",
      "Im Zweifel: Bank direkt anrufen"
    ],
    "relatedTopics": ["identity_theft", "password_security", "2fa"]
  },
  "progress": {
    "completed": false,
    "percentComplete": 0
  }
}
```

---

### 6. POST `/api/v2/coach/session`

Erstellt oder lädt eine Chat-Session.

**Request (neue Session):**
```json
{
  "action": "create",
  "userProfile": {
    "privacyLevel": "beginner",
    "language": "de",
    "interests": ["social_media", "banking"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session_xyz789",
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-15T11:30:00Z",
    "userProfile": {
      "privacyLevel": "beginner",
      "language": "de"
    },
    "conversationHistory": [],
    "context": {
      "lastAnalyzedText": null,
      "topicsDiscussed": [],
      "suggestedActions": []
    }
  },
  "welcomeMessage": {
    "message": "Hallo! 👋 Ich bin dein Privacy Coach. Ich helfe dir, deine Daten besser zu schützen.\n\nDu kannst mich alles über Datenschutz fragen, oder ich erkläre dir die Risiken deiner Texte.\n\nWomit kann ich dir heute helfen?",
    "suggestions": [
      {"text": "Was sind personenbezogene Daten?", "action": "ask"},
      {"text": "Analysiere meinen Text", "action": "analyze"},
      {"text": "Zeige mir Lern-Themen", "action": "topics"}
    ]
  }
}
```

---

### 7. POST `/api/v2/coach/feedback`

Sammelt Nutzer-Feedback zu Coach-Antworten.

**Request:**
```json
{
  "sessionId": "session_abc123",
  "messageId": "msg_456",
  "rating": "helpful",
  "comment": "Sehr verständlich erklärt!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Danke für dein Feedback! Es hilft mir, besser zu werden."
}
```

---

### 8. GET `/api/v2/coach/quick-tips`

Liefert schnelle Privacy-Tipps für die UI.

**Response:**
```json
{
  "success": true,
  "tips": [
    {
      "id": "tip_001",
      "icon": "💡",
      "title": "Tipp des Tages",
      "content": "Verwende für jeden Dienst ein einzigartiges Passwort. Ein Passwort-Manager hilft dabei!",
      "category": "password_security",
      "actionButton": {
        "text": "Mehr erfahren",
        "action": "topic",
        "params": {"topicId": "password_security"}
      }
    },
    {
      "id": "tip_002",
      "icon": "🔒",
      "title": "Wusstest du?",
      "content": "In der EU hast du das Recht, deine Daten von jedem Unternehmen löschen zu lassen (DSGVO Art. 17).",
      "category": "gdpr",
      "actionButton": {
        "text": "DSGVO verstehen",
        "action": "topic",
        "params": {"topicId": "gdpr_basics"}
      }
    }
  ],
  "dailyChallenge": {
    "title": "Heutige Challenge",
    "description": "Prüfe die Datenschutz-Einstellungen deines Lieblings-Social-Media-Accounts",
    "reward": "+10 Privacy Score",
    "difficulty": "easy"
  }
}
```

---

## Datenmodelle

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
  messageType?: 'question' | 'explanation' | 'warning' | 'tip' | 'action';
  metadata?: {
    confidence?: number;
    sources?: Source[];
    relatedTopics?: string[];
  };
}
```

### CoachSession
```typescript
interface CoachSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  userProfile: {
    privacyLevel: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    interests?: string[];
  };
  conversationHistory: ChatMessage[];
  context: {
    lastAnalyzedText?: string;
    lastAnalysisResults?: AnalysisResult;
    topicsDiscussed: string[];
    suggestedActions: SuggestedAction[];
  };
}
```

### Topic
```typescript
interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  content: TopicContent;
  relatedTopics: string[];
}
```

---

## Wissensbasis

Der Coach sollte Zugriff auf folgende Wissensbereiche haben:

### Datenschutz-Grundlagen
- DSGVO / GDPR
- Personenbezogene Daten (PII)
- Datenschutz-Grundsätze

### Risiko-Typen
- Alle erkannten Datentypen und deren Risiken
- Kombinationsrisiken
- Reale Bedrohungsszenarien

### Schutzmaßnahmen
- Best Practices für jeden Datentyp
- Passwort-Sicherheit
- 2-Faktor-Authentifizierung
- Privacy-Einstellungen sozialer Netzwerke

### Aktuelle Bedrohungen
- Phishing-Methoden
- Social Engineering
- Aktuelle Datenlecks

---

## KI-Integration

### Empfohlene Ansätze

1. **Rule-Based + Templates**: Vordefinierte Antworten für häufige Fragen
2. **LLM-Integration (optional)**: Für komplexe, offene Fragen
3. **Hybrid**: Rules für Kernfunktionen, LLM für Konversation

### Kontext-Handling
- Session-basiert: Konversationshistorie behalten
- Analyse-Kontext: Vorherige Analysen einbeziehen
- Personalisierung: Nutzer-Level berücksichtigen

---

## Sicherheitsanforderungen

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/coach/chat` | 30 | pro Minute |
| `/coach/explain` | 20 | pro Minute |
| `/coach/analyze-risk` | 10 | pro Minute |
| `/coach/topics` | 60 | pro Minute |
| `/coach/session` | 5 | pro Minute |

### Datenschutz
- Sessions nach 1 Stunde Inaktivität löschen
- Keine dauerhafte Speicherung von Chat-Inhalten
- Anonymisiertes Feedback-Logging

---

## Implementierungshinweise

### Priorität 1 - Core Chat
1. Session-Management
2. Chat-Endpoint mit Template-Antworten
3. Basis-Erklärungen für alle Risiko-Typen

### Priorität 2 - Lern-Inhalte
1. Topic-Struktur und Inhalte
2. Interaktive Quiz-Elemente
3. Progress-Tracking

### Priorität 3 - Erweiterte Features
1. LLM-Integration für natürliche Konversation
2. Personalisierte Empfehlungen
3. Gamification (Challenges, Achievements)

---

## Beispiel-Konversationen

### Beispiel 1: Risiko-Erklärung
```
User: Warum ist es schlecht, mein Geburtsdatum zu teilen?

Coach: Gute Frage! Dein Geburtsdatum ist sensibler als du denkst:

📅 **Allein**: Geburtsdatum grenzt dich auf ~0,3% der Bevölkerung ein

🔗 **In Kombination**: Mit Name + Geburtstag bist du oft schon eindeutig identifizierbar

⚠️ **Risiken**:
- Häufig als Sicherheitsfrage verwendet
- Teil von Identitätsdiebstahl-Datensätzen
- Ermöglicht Altersverifizierungs-Betrug

💡 **Tipp**: Teile maximal Monat + Jahr, nie den genauen Tag!

Soll ich dir zeigen, wie du dein Alter sicher angeben kannst?
```

### Beispiel 2: Nach Analyse
```
[Nach Analyse eines Textes mit Adresse]

Coach: Ich sehe, dein Text enthält deine vollständige Adresse. Das ist kritisch! 🚨

Deine Adresse ist wie ein digitaler Fingerabdruck - sie identifiziert dich eindeutig.

**Was könnte passieren?**
- Unerwünschte Post oder Pakete
- Stalking-Risiko
- Einbruch-Gefahr bei Urlaubsankündigungen

**Mein Vorschlag**:
Ersetze "Hauptstraße 15, 80331 München" durch einfach "München" oder "Bayern".

Soll ich den Text für dich umschreiben?
```

---

## Version History

| Version | Datum | Änderungen |
|---------|-------|------------|
| 10.0.0 | TBD | Initial Release - Smart Privacy Coach |

---

## Zusammenfassung der neuen Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/v2/coach/chat` | Chat-Interaktion |
| POST | `/api/v2/coach/explain` | Begriff erklären |
| POST | `/api/v2/coach/analyze-risk` | Risiko-Analyse mit Erklärung |
| GET | `/api/v2/coach/topics` | Lern-Themen auflisten |
| GET | `/api/v2/coach/topic/{id}` | Themen-Details |
| POST | `/api/v2/coach/session` | Session erstellen/laden |
| POST | `/api/v2/coach/feedback` | Feedback senden |
| GET | `/api/v2/coach/quick-tips` | Schnelle Tipps |
