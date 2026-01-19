// Netlify Function: Phase 11 - Privacy Templates - Favorites
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const sessionId = event.queryStringParameters?.sessionId ||
                    (event.body ? JSON.parse(event.body).sessionId : null);

  if (event.httpMethod === "GET") {
    // Get favorites
    try {
      const response = await fetch(`${API_BASE}/api/v2/templates/favorites?sessionId=${sessionId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable for favorites");
    }

    // Fallback - return empty (favorites stored in localStorage on client)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        favorites: [],
        note: "Favoriten werden lokal im Browser gespeichert"
      })
    };
  }

  if (event.httpMethod === "POST") {
    // Add/remove favorite
    try {
      const body = JSON.parse(event.body || "{}");
      const { templateId, action } = body;

      if (!templateId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "templateId erforderlich" })
        };
      }

      try {
        const response = await fetch(`${API_BASE}/api/v2/templates/favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, templateId, action: action || "add" })
        });

        if (response.ok) {
          const data = await response.json();
          return { statusCode: 200, headers, body: JSON.stringify(data) };
        }
      } catch (apiError) {
        console.log("Backend unavailable for favorite action");
      }

      // Fallback - acknowledge but store client-side
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: action === "remove" ? "Favorit entfernt" : "Als Favorit gespeichert",
          templateId: templateId,
          note: "Speicherung erfolgt lokal im Browser"
        })
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Fehler beim Speichern" })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" })
  };
};
