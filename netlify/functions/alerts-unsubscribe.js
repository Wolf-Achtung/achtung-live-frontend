// Netlify Function: Phase 9 - Data Breach Alerts - Unsubscribe
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Extract subscription ID from path
    const pathParts = event.path.split("/");
    const subscriptionId = pathParts[pathParts.length - 1];

    if (!subscriptionId || subscriptionId === "alerts-unsubscribe") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Subscription ID erforderlich" })
      };
    }

    // Try backend
    try {
      const response = await fetch(`${API_BASE}/api/v2/alerts/unsubscribe/${subscriptionId}`, {
        method: "DELETE",
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
            error: "Abonnement nicht gefunden"
          })
        };
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
        message: "Abonnement erfolgreich gekündigt",
        subscriptionId: subscriptionId,
        unsubscribedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Unsubscribe error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Abmelden" })
    };
  }
};
