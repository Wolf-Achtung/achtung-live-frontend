// Netlify Function: Phase 11 - Privacy Templates - Categories
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

const TEMPLATE_CATEGORIES = [
  {
    id: "social_media",
    name: "Social Media",
    icon: "📱",
    description: "Sichere Bio-Texte für Social Media Profile",
    templateCount: 12,
    color: "#e91e63"
  },
  {
    id: "job_application",
    name: "Bewerbungen",
    icon: "💼",
    description: "Datenschutzfreundliche Bewerbungstexte",
    templateCount: 8,
    color: "#3f51b5"
  },
  {
    id: "online_forms",
    name: "Online-Formulare",
    icon: "📝",
    description: "Minimale Angaben für Registrierungen",
    templateCount: 6,
    color: "#009688"
  },
  {
    id: "email_responses",
    name: "E-Mail Antworten",
    icon: "✉️",
    description: "Ablehnungen von Datenanfragen",
    templateCount: 10,
    color: "#ff9800"
  },
  {
    id: "gdpr_requests",
    name: "DSGVO-Anfragen",
    icon: "⚖️",
    description: "Auskunfts- und Löschungsanfragen",
    templateCount: 5,
    color: "#673ab7"
  }
];

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
    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/templates/categories`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using fallback");
    }

    // Fallback response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        categories: TEMPLATE_CATEGORIES,
        totalTemplates: 41
      })
    };

  } catch (error) {
    console.error("Categories error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Laden der Kategorien" })
    };
  }
};
