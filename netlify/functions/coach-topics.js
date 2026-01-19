// Netlify Function als Proxy für die Coach Topics API
// Phase 10: Smart Privacy Coach - Topics Endpoint

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_TOPICS_URL = `${API_BASE}/api/v2/coach/topics`;

// Client-side fallback topics
const FALLBACK_TOPICS = {
  success: true,
  categories: [
    {
      id: "basics",
      name: "Grundlagen",
      icon: "📚",
      topics: [
        {
          id: "what_is_privacy",
          title: "Was ist Datenschutz?",
          description: "Die Grundlagen verstehen",
          difficulty: "beginner",
          duration: "5 min",
          icon: "🔒"
        },
        {
          id: "gdpr_basics",
          title: "DSGVO einfach erklärt",
          description: "Deine Rechte in der EU",
          difficulty: "beginner",
          duration: "10 min",
          icon: "🇪🇺"
        }
      ]
    },
    {
      id: "data_types",
      name: "Datentypen",
      icon: "📊",
      topics: [
        {
          id: "pii_explained",
          title: "Persönliche Daten (PII)",
          description: "Was sind personenbezogene Daten?",
          difficulty: "beginner",
          duration: "7 min",
          icon: "👤"
        },
        {
          id: "financial_data",
          title: "Finanzdaten schützen",
          description: "IBAN, Kreditkarte & Co",
          difficulty: "intermediate",
          duration: "12 min",
          icon: "💳"
        }
      ]
    },
    {
      id: "threats",
      name: "Bedrohungen",
      icon: "⚠️",
      topics: [
        {
          id: "phishing",
          title: "Phishing erkennen",
          description: "Betrügerische Nachrichten entlarven",
          difficulty: "beginner",
          duration: "8 min",
          icon: "🎣"
        },
        {
          id: "identity_theft",
          title: "Identitätsdiebstahl",
          description: "Wie Kriminelle deine Identität stehlen",
          difficulty: "intermediate",
          duration: "15 min",
          icon: "🎭"
        },
        {
          id: "deanonymization",
          title: "Deanonymisierung",
          description: "Wie man aus anonymen Daten Personen erkennt",
          difficulty: "advanced",
          duration: "20 min",
          icon: "🔍"
        }
      ]
    },
    {
      id: "protection",
      name: "Schutzmaßnahmen",
      icon: "🛡️",
      topics: [
        {
          id: "password_security",
          title: "Sichere Passwörter",
          description: "Passwort-Manager und 2FA",
          difficulty: "beginner",
          duration: "10 min",
          icon: "🔑"
        },
        {
          id: "social_media_privacy",
          title: "Social Media Einstellungen",
          description: "Facebook, Instagram & Co absichern",
          difficulty: "intermediate",
          duration: "15 min",
          icon: "📱"
        }
      ]
    }
  ],
  featuredTopic: {
    id: "current_threats_2025",
    title: "Aktuelle Bedrohungen 2025",
    description: "Die neuesten Betrugsmaschen",
    badge: "NEU"
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

  try {
    console.log("Fetching topics from:", API_TOPICS_URL);

    const response = await fetch(API_TOPICS_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      console.log("Backend unavailable, using fallback topics");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(FALLBACK_TOPICS)
      };
    }

    const data = await response.json();
    console.log("Topics fetched successfully");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.log("Error fetching topics, using fallback:", error.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(FALLBACK_TOPICS)
    };
  }
};
