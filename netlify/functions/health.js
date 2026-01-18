// Netlify Function für Health Check API v2
// Proxy für den API-Status und Provider-Check

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_HEALTH_URL = `${API_BASE}/api/v2/health`;

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Nur GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const response = await fetch(API_HEALTH_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      // Backend nicht erreichbar aber Netlify läuft
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "degraded",
          message: "Backend nicht erreichbar",
          providers: {
            openai: { status: "unknown" },
            anthropic: { status: "unknown" }
          },
          version: "2.1.0",
          uptime: 0
        })
      };
    }

    const data = await response.json();

    // Ensure status is set to healthy if backend responds OK
    if (!data.status) {
      data.status = 'healthy';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Health Check Error:", error.message);

    // Netlify funktioniert, Backend nicht
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "unhealthy",
        message: "Backend Verbindung fehlgeschlagen",
        error: error.message,
        providers: {
          openai: { status: "error" },
          anthropic: { status: "error" }
        },
        version: "2.1.0"
      })
    };
  }
};
