// Netlify Function: Phase 9 - Data Breach Alerts - Verify Subscription
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
    // Extract token from path
    const pathParts = event.path.split("/");
    const token = pathParts[pathParts.length - 1];

    if (!token || token === "alerts-verify") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Verifizierungs-Token erforderlich" })
      };
    }

    // Verifizierung läuft ausschließlich über das Backend, das die echten
    // Tokens hält (verificationTokens-Store in server.js). Es gibt keinen
    // clientseitigen/Fallback-Ersatz mehr, der ein Token allein anhand seiner
    // Länge als "verifiziert" durchwinkt - das wäre eine Umgehung der
    // E-Mail-Besitzprüfung.
    try {
      const response = await fetch(`${API_BASE}/api/v2/alerts/verify/${token}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }

      if (response.status === 404) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Token nicht gefunden oder abgelaufen"
          })
        };
      }

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Verifizierung fehlgeschlagen"
        })
      };
    } catch (apiError) {
      console.error("Backend unavailable:", apiError.message);
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Verifizierungsdienst vorübergehend nicht erreichbar. Bitte versuche es später erneut."
        })
      };
    }

  } catch (error) {
    console.error("Verify error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler bei der Verifizierung" })
    };
  }
};
