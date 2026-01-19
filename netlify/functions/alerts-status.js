// Netlify Function: Phase 9 - Data Breach Alerts - Status Check
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

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
    const email = event.queryStringParameters?.email;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "E-Mail-Parameter erforderlich" })
      };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/alerts/status/${encodeURIComponent(email)}`, {
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
        email: email,
        status: "not_subscribed",
        message: "Diese E-Mail ist noch nicht für Monitoring registriert",
        canSubscribe: true
      })
    };

  } catch (error) {
    console.error("Status check error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler bei der Statusabfrage" })
    };
  }
};
