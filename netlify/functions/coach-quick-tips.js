// Netlify Function als Proxy für die Coach Quick Tips API
// Phase 10: Smart Privacy Coach - Quick Tips Endpoint

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_QUICK_TIPS_URL = `${API_BASE}/api/v2/coach/quick-tips`;

// Client-side fallback tips
const FALLBACK_TIPS = {
  success: true,
  tips: [
    {
      id: "tip_001",
      icon: "💡",
      title: "Tipp des Tages",
      content: "Verwende für jeden Dienst ein einzigartiges Passwort. Ein Passwort-Manager hilft dabei!",
      category: "password_security",
      actionButton: {
        text: "Mehr erfahren",
        action: "topic",
        params: { topicId: "password_security" }
      }
    },
    {
      id: "tip_002",
      icon: "🔒",
      title: "Wusstest du?",
      content: "In der EU hast du das Recht, deine Daten von jedem Unternehmen löschen zu lassen (DSGVO Art. 17).",
      category: "gdpr",
      actionButton: {
        text: "DSGVO verstehen",
        action: "topic",
        params: { topicId: "gdpr_basics" }
      }
    },
    {
      id: "tip_003",
      icon: "🎣",
      title: "Sicherheitstipp",
      content: "Prüfe immer die Absender-Adresse bei E-Mails. Betrüger nutzen ähnlich aussehende Domains!",
      category: "phishing",
      actionButton: {
        text: "Phishing erkennen",
        action: "topic",
        params: { topicId: "phishing" }
      }
    },
    {
      id: "tip_004",
      icon: "📱",
      title: "Privacy Tipp",
      content: "Aktiviere die 2-Faktor-Authentifizierung für alle wichtigen Accounts - besonders E-Mail und Banking!",
      category: "2fa",
      actionButton: {
        text: "Mehr zu Passwörtern",
        action: "topic",
        params: { topicId: "password_security" }
      }
    },
    {
      id: "tip_005",
      icon: "🔍",
      title: "Datenschutz",
      content: "Je mehr persönliche Details du teilst, desto leichter bist du zu identifizieren. Frage dich: Muss ich das wirklich teilen?",
      category: "pii",
      actionButton: {
        text: "Mehr zu PII",
        action: "topic",
        params: { topicId: "pii_explained" }
      }
    }
  ],
  dailyChallenge: {
    title: "Heutige Challenge",
    description: "Prüfe die Datenschutz-Einstellungen deines Lieblings-Social-Media-Accounts",
    reward: "+10 Privacy Score",
    difficulty: "easy",
    icon: "🏆"
  }
};

// Get a random tip from the list
function getRandomTip(tips) {
  const randomIndex = Math.floor(Math.random() * tips.length);
  return tips[randomIndex];
}

// Get daily challenge based on day of week
function getDailyChallenge() {
  const challenges = [
    {
      title: "Passwort-Check",
      description: "Ändere ein Passwort, das du schon länger nicht geändert hast",
      reward: "+15 Privacy Score",
      difficulty: "easy",
      icon: "🔑"
    },
    {
      title: "2FA aktivieren",
      description: "Aktiviere 2-Faktor-Authentifizierung für einen wichtigen Account",
      reward: "+25 Privacy Score",
      difficulty: "medium",
      icon: "🛡️"
    },
    {
      title: "Privacy-Einstellungen",
      description: "Prüfe die Datenschutz-Einstellungen deines Lieblings-Social-Media-Accounts",
      reward: "+10 Privacy Score",
      difficulty: "easy",
      icon: "📱"
    },
    {
      title: "Datenleck-Check",
      description: "Prüfe ob deine E-Mail in einem Datenleck aufgetaucht ist",
      reward: "+20 Privacy Score",
      difficulty: "easy",
      icon: "🔍"
    },
    {
      title: "Browser aufräumen",
      description: "Lösche Cookies und überprüfe deine Browser-Erweiterungen",
      reward: "+15 Privacy Score",
      difficulty: "easy",
      icon: "🧹"
    },
    {
      title: "App-Berechtigungen",
      description: "Überprüfe die Berechtigungen deiner Handy-Apps",
      reward: "+20 Privacy Score",
      difficulty: "medium",
      icon: "📲"
    },
    {
      title: "Datenauskunft",
      description: "Fordere von einem Dienst Auskunft über deine gespeicherten Daten an (DSGVO)",
      reward: "+30 Privacy Score",
      difficulty: "hard",
      icon: "📋"
    }
  ];

  const dayOfWeek = new Date().getDay();
  return challenges[dayOfWeek];
}

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
    console.log("Fetching quick tips from:", API_QUICK_TIPS_URL);

    const response = await fetch(API_QUICK_TIPS_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      console.log("Backend unavailable, using fallback tips");

      // Return a random tip and daily challenge
      const randomTip = getRandomTip(FALLBACK_TIPS.tips);
      const dailyChallenge = getDailyChallenge();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          tips: [randomTip],
          dailyChallenge: dailyChallenge
        })
      };
    }

    const data = await response.json();
    console.log("Quick tips fetched successfully");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.log("Error fetching tips, using fallback:", error.message);

    const randomTip = getRandomTip(FALLBACK_TIPS.tips);
    const dailyChallenge = getDailyChallenge();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tips: [randomTip],
        dailyChallenge: dailyChallenge
      })
    };
  }
};
