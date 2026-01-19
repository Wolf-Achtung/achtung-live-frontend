// Netlify Function als Proxy für die Coach Topic Detail API
// Phase 10: Smart Privacy Coach - Topic Detail Endpoint

const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Client-side fallback topic content
const FALLBACK_TOPICS = {
  phishing: {
    success: true,
    topic: {
      id: "phishing",
      title: "Phishing erkennen",
      icon: "🎣",
      difficulty: "beginner",
      duration: "8 min"
    },
    content: {
      introduction: "Phishing ist eine der häufigsten Betrugsmaschen im Internet. Betrüger versuchen, dich mit gefälschten E-Mails oder Websites zur Preisgabe sensibler Daten zu verleiten.",
      sections: [
        {
          title: "Was ist Phishing?",
          content: "Phishing kommt vom englischen 'fishing' (Angeln). Betrüger 'angeln' nach deinen Daten, indem sie sich als vertrauenswürdige Absender ausgeben."
        },
        {
          title: "Typische Merkmale",
          content: "So erkennst du Phishing-Versuche:",
          bulletPoints: [
            "Dringlichkeit: 'Ihr Konto wird gesperrt!'",
            "Rechtschreibfehler und seltsame Formulierungen",
            "Verdächtige Absender-Adressen",
            "Links zu falschen Websites",
            "Aufforderung zur Dateneingabe"
          ]
        },
        {
          title: "Praxis-Check",
          type: "interactive",
          quiz: [
            {
              question: "Diese Mail behauptet von deiner Bank zu sein. Der Absender ist 'service@sparkasse-sicherheit.com'. Ist das verdächtig?",
              options: ["Ja, verdächtig", "Nein, sieht legitim aus"],
              correct: 0,
              explanation: "Echte Bank-Mails kommen von @sparkasse.de, nicht von Phantasie-Domains!"
            }
          ]
        }
      ],
      keyTakeaways: [
        "Nie auf Links in verdächtigen Mails klicken",
        "Absender-Adresse genau prüfen",
        "Im Zweifel: Bank direkt anrufen"
      ],
      relatedTopics: ["identity_theft", "password_security"]
    }
  },
  gdpr_basics: {
    success: true,
    topic: {
      id: "gdpr_basics",
      title: "DSGVO einfach erklärt",
      icon: "🇪🇺",
      difficulty: "beginner",
      duration: "10 min"
    },
    content: {
      introduction: "Die Datenschutz-Grundverordnung (DSGVO) ist ein EU-Gesetz, das deine persönlichen Daten schützt und dir starke Rechte gibt.",
      sections: [
        {
          title: "Deine wichtigsten Rechte",
          content: "Die DSGVO gibt dir folgende Rechte:",
          bulletPoints: [
            "Auskunftsrecht: Erfahre welche Daten über dich gespeichert sind",
            "Recht auf Löschung: Lass deine Daten löschen",
            "Datenportabilität: Nimm deine Daten mit",
            "Widerspruchsrecht: Stoppe die Datenverarbeitung"
          ]
        },
        {
          title: "Praxis-Check",
          type: "interactive",
          quiz: [
            {
              question: "Ein Online-Shop will deine Daten nicht löschen. Was kannst du tun?",
              options: ["Beschwerde bei der Datenschutzbehörde einreichen", "Nichts, der Shop hat Recht"],
              correct: 0,
              explanation: "Du hast das Recht auf Löschung (Art. 17 DSGVO). Bei Weigerung: Beschwerde einreichen!"
            }
          ]
        }
      ],
      keyTakeaways: [
        "Du hast das Recht zu wissen, welche Daten gespeichert sind",
        "Du kannst jederzeit Löschung verlangen",
        "Bei Verstößen: Datenschutzbehörde einschalten"
      ],
      relatedTopics: ["pii_explained", "social_media_privacy"]
    }
  },
  password_security: {
    success: true,
    topic: {
      id: "password_security",
      title: "Sichere Passwörter",
      icon: "🔑",
      difficulty: "beginner",
      duration: "10 min"
    },
    content: {
      introduction: "Passwörter sind der Schlüssel zu deinem digitalen Leben. Lerne, wie du sie richtig schützt.",
      sections: [
        {
          title: "Was macht ein gutes Passwort aus?",
          content: "Ein sicheres Passwort sollte:",
          bulletPoints: [
            "Mindestens 12 Zeichen lang sein",
            "Groß- und Kleinbuchstaben enthalten",
            "Zahlen und Sonderzeichen haben",
            "Kein Wörterbuch-Wort sein",
            "Für jeden Dienst einzigartig sein"
          ]
        },
        {
          title: "2-Faktor-Authentifizierung (2FA)",
          content: "2FA fügt eine zweite Sicherheitsebene hinzu. Selbst wenn jemand dein Passwort kennt, braucht er noch den zweiten Faktor (z.B. dein Handy)."
        },
        {
          title: "Praxis-Check",
          type: "interactive",
          quiz: [
            {
              question: "Welches Passwort ist sicherer?",
              options: ["Kx7#mP9$vL2@nQ", "Passwort123!"],
              correct: 0,
              explanation: "Das erste Passwort ist zufällig und enthält verschiedene Zeichentypen. 'Passwort123!' ist zu vorhersehbar!"
            }
          ]
        }
      ],
      keyTakeaways: [
        "Nutze einen Passwort-Manager",
        "Aktiviere 2FA wo immer möglich",
        "Jeder Account braucht ein eigenes Passwort"
      ],
      relatedTopics: ["phishing", "identity_theft"]
    }
  },
  pii_explained: {
    success: true,
    topic: {
      id: "pii_explained",
      title: "Persönliche Daten (PII)",
      icon: "👤",
      difficulty: "beginner",
      duration: "7 min"
    },
    content: {
      introduction: "Personenbezogene Daten (PII = Personally Identifiable Information) sind alle Informationen, die dich direkt oder indirekt identifizieren können.",
      sections: [
        {
          title: "Direkte Identifikatoren",
          content: "Diese Daten identifizieren dich sofort:",
          bulletPoints: [
            "Name",
            "Adresse",
            "Telefonnummer",
            "E-Mail-Adresse",
            "Personalausweisnummer"
          ]
        },
        {
          title: "Indirekte Identifikatoren",
          content: "Diese Daten können in Kombination zur Identifikation führen:",
          bulletPoints: [
            "Geburtsdatum",
            "Arbeitgeber",
            "IP-Adresse",
            "Standortdaten",
            "Gerätekennungen"
          ]
        },
        {
          title: "Praxis-Check",
          type: "interactive",
          quiz: [
            {
              question: "Ist dein Geburtsdatum allein schon ein Risiko?",
              options: ["Nein, aber in Kombination mit anderen Daten schon", "Ja, immer kritisch"],
              correct: 0,
              explanation: "Richtig! Geburtsdatum + Name + Wohnort macht dich oft einzigartig identifizierbar."
            }
          ]
        }
      ],
      keyTakeaways: [
        "Teile nie mehr Daten als nötig",
        "Auch 'harmlose' Daten können in Kombination gefährlich sein",
        "Prüfe immer: Wofür werden meine Daten verwendet?"
      ],
      relatedTopics: ["gdpr_basics", "deanonymization"]
    }
  }
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  // Extract topic ID from path
  const pathParts = event.path.split('/');
  const topicId = pathParts[pathParts.length - 1] || event.queryStringParameters?.topicId;

  if (!topicId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Keine Topic-ID angegeben" })
    };
  }

  const API_TOPIC_URL = `${API_BASE}/api/v2/coach/topic/${topicId}`;

  try {
    console.log("Fetching topic detail from:", API_TOPIC_URL);

    const response = await fetch(API_TOPIC_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      console.log("Backend unavailable, using fallback for topic:", topicId);

      if (FALLBACK_TOPICS[topicId]) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(FALLBACK_TOPICS[topicId])
        };
      }

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Thema nicht gefunden", topicId })
      };
    }

    const data = await response.json();
    console.log("Topic detail fetched successfully");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.log("Error fetching topic, using fallback:", error.message);

    if (FALLBACK_TOPICS[topicId]) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(FALLBACK_TOPICS[topicId])
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Laden des Themas", details: error.message })
    };
  }
};
