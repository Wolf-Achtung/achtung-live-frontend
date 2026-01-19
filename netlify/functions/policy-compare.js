// Netlify Function: Phase 13 - Privacy Policy Analyzer - Compare Services
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Service data for comparison
const SERVICE_DATA = {
  google: {
    name: "Google",
    scores: { dataCollection: 30, dataSelling: 40, userRights: 60, retention: 45, security: 70 },
    practices: {
      collectedData: ["Suchverlauf", "Standort", "Geräteinformationen", "YouTube-Verlauf", "Gmail-Inhalte", "Kontakte"],
      dataSharing: ["Werbepartner", "Tochterunternehmen", "Behörden bei Anfrage"],
      retention: "Variabel - teilweise unbegrenzt",
      encryption: "In Transit und At Rest",
      gdprCompliant: true
    }
  },
  facebook: {
    name: "Facebook",
    scores: { dataCollection: 20, dataSelling: 25, userRights: 50, retention: 35, security: 55 },
    practices: {
      collectedData: ["Posts", "Nachrichten", "Fotos", "Standort", "Gesichtserkennung", "Off-Facebook-Aktivitäten"],
      dataSharing: ["Werbepartner", "Meta-Unternehmen", "App-Entwickler", "Forschung"],
      retention: "Bis zur Löschung + Backups",
      encryption: "Teilweise E2E (Messenger optional)",
      gdprCompliant: true
    }
  },
  apple: {
    name: "Apple",
    scores: { dataCollection: 70, dataSelling: 95, userRights: 80, retention: 75, security: 90 },
    practices: {
      collectedData: ["Gerätenutzung", "App-Nutzung", "Siri-Anfragen", "Zahlungsdaten"],
      dataSharing: ["Minimal - hauptsächlich intern"],
      retention: "Definierte Zeiträume",
      encryption: "E2E für viele Services",
      gdprCompliant: true
    }
  },
  signal: {
    name: "Signal",
    scores: { dataCollection: 95, dataSelling: 100, userRights: 95, retention: 95, security: 100 },
    practices: {
      collectedData: ["Telefonnummer (für Registrierung)"],
      dataSharing: ["Keine"],
      retention: "Minimal - nur technisch notwendig",
      encryption: "E2E für alles",
      gdprCompliant: true
    }
  },
  whatsapp: {
    name: "WhatsApp",
    scores: { dataCollection: 50, dataSelling: 55, userRights: 60, retention: 50, security: 75 },
    practices: {
      collectedData: ["Kontakte", "Metadaten", "Geräteinformationen", "Standort"],
      dataSharing: ["Meta-Unternehmen", "Business-Kunden"],
      retention: "Metadaten längerfristig",
      encryption: "E2E für Nachrichten",
      gdprCompliant: true
    }
  },
  tiktok: {
    name: "TikTok",
    scores: { dataCollection: 15, dataSelling: 20, userRights: 40, retention: 30, security: 45 },
    practices: {
      collectedData: ["Videos", "Interaktionen", "Geräte-Fingerprint", "Standort", "Clipboard", "Kontakte"],
      dataSharing: ["Werbepartner", "Analyse-Dienste"],
      retention: "Unklar definiert",
      encryption: "In Transit",
      gdprCompliant: true
    }
  },
  protonmail: {
    name: "ProtonMail",
    scores: { dataCollection: 90, dataSelling: 100, userRights: 95, retention: 90, security: 98 },
    practices: {
      collectedData: ["E-Mail-Adresse", "IP (optional maskiert)"],
      dataSharing: ["Keine"],
      retention: "Nutzergesteuert",
      encryption: "Zero-Access E2E",
      gdprCompliant: true
    }
  },
  spotify: {
    name: "Spotify",
    scores: { dataCollection: 45, dataSelling: 50, userRights: 65, retention: 55, security: 70 },
    practices: {
      collectedData: ["Hörverhalten", "Playlists", "Geräteinformationen", "Zahlungsdaten"],
      dataSharing: ["Werbepartner (Free)", "Künstler-Statistiken"],
      retention: "Während Kontobestand + danach",
      encryption: "In Transit",
      gdprCompliant: true
    }
  },
  microsoft: {
    name: "Microsoft",
    scores: { dataCollection: 50, dataSelling: 60, userRights: 70, retention: 55, security: 75 },
    practices: {
      collectedData: ["Gerätenutzung", "Cortana", "Office-Dokumente", "Browserverlauf (Edge)"],
      dataSharing: ["Werbepartner", "LinkedIn"],
      retention: "Variabel nach Service",
      encryption: "Verfügbar",
      gdprCompliant: true
    }
  },
  amazon: {
    name: "Amazon",
    scores: { dataCollection: 40, dataSelling: 50, userRights: 60, retention: 50, security: 70 },
    practices: {
      collectedData: ["Kaufhistorie", "Suchverlauf", "Alexa-Aufnahmen", "Kindle-Lesegewohnheiten"],
      dataSharing: ["Werbepartner", "Verkäufer"],
      retention: "Langfristig",
      encryption: "In Transit",
      gdprCompliant: true
    }
  }
};

const SCORE_CATEGORIES = {
  dataCollection: { name: "Datensammlung", description: "Wie wenig Daten werden gesammelt (höher = besser)" },
  dataSelling: { name: "Datenverkauf", description: "Werden Daten nicht verkauft/geteilt (höher = besser)" },
  userRights: { name: "Nutzerrechte", description: "Kontrolle über eigene Daten (höher = besser)" },
  retention: { name: "Speicherdauer", description: "Angemessene Löschfristen (höher = besser)" },
  security: { name: "Sicherheit", description: "Technische Schutzmaßnahmen (höher = besser)" }
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { services } = body;

    if (!services || !Array.isArray(services) || services.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Mindestens 2 Services zum Vergleich erforderlich" })
      };
    }

    if (services.length > 4) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Maximal 4 Services können verglichen werden" })
      };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/policy/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services })
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using fallback");
    }

    // Build comparison from fallback data
    const comparison = [];
    const unknownServices = [];

    for (const serviceId of services) {
      const data = SERVICE_DATA[serviceId.toLowerCase()];
      if (data) {
        const avgScore = Math.round(
          Object.values(data.scores).reduce((a, b) => a + b, 0) / Object.keys(data.scores).length
        );
        comparison.push({
          id: serviceId.toLowerCase(),
          name: data.name,
          overallScore: avgScore,
          scores: data.scores,
          practices: data.practices
        });
      } else {
        unknownServices.push(serviceId);
      }
    }

    if (comparison.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Nicht genügend bekannte Services für Vergleich",
          unknownServices: unknownServices
        })
      };
    }

    // Find winner for each category
    const categoryWinners = {};
    for (const category of Object.keys(SCORE_CATEGORIES)) {
      let winner = comparison[0];
      for (const service of comparison) {
        if (service.scores[category] > winner.scores[category]) {
          winner = service;
        }
      }
      categoryWinners[category] = winner.id;
    }

    // Overall winner
    const overallWinner = comparison.reduce((a, b) =>
      a.overallScore > b.overallScore ? a : b
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        comparison: comparison,
        scoreCategories: SCORE_CATEGORIES,
        categoryWinners: categoryWinners,
        overallWinner: {
          id: overallWinner.id,
          name: overallWinner.name,
          score: overallWinner.overallScore
        },
        unknownServices: unknownServices.length > 0 ? unknownServices : undefined,
        recommendation: generateRecommendation(comparison, overallWinner)
      })
    };

  } catch (error) {
    console.error("Compare error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Vergleich" })
    };
  }
};

function generateRecommendation(comparison, winner) {
  const loser = comparison.reduce((a, b) =>
    a.overallScore < b.overallScore ? a : b
  );

  if (winner.overallScore >= 80) {
    return `${winner.name} ist eine datenschutzfreundliche Wahl mit einem Score von ${winner.overallScore}/100.`;
  } else if (winner.overallScore >= 60) {
    return `${winner.name} ist die bessere Wahl unter den verglichenen Services, aber es gibt noch Verbesserungspotential.`;
  } else {
    return `Alle verglichenen Services haben Datenschutz-Schwächen. ${winner.name} ist relativ am besten, aber erwäge Alternativen wie Signal oder ProtonMail.`;
  }
}
