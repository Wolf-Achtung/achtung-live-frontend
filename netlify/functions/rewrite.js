// Netlify Function für Smart Rewrite API v2
// Proxy für die Rewrite-API mit anonymize/redact/pseudonymize Modi

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_REWRITE_URL = `${API_BASE}/api/v2/rewrite`;

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Nur POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Ungültiges JSON" })
      };
    }

    if (!requestBody.text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Kein Text angegeben" })
      };
    }

    // Validiere Modus
    const validModes = ['anonymize', 'redact', 'pseudonymize'];
    const mode = validModes.includes(requestBody.mode) ? requestBody.mode : 'anonymize';

    const apiRequest = {
      text: requestBody.text,
      mode: mode,
      categories: requestBody.categories || [],
      preserveFormat: requestBody.preserveFormat !== false
    };

    console.log("Rewrite Request:", { mode, textLength: requestBody.text.length });

    const response = await fetch(API_REWRITE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Rewrite API Error:", errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: "Rewrite fehlgeschlagen",
          status: response.status,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log("Rewrite erfolgreich:", data.changes?.length || 0, "Änderungen");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Rewrite Proxy Error:", error.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: "Verbindung zum Backend fehlgeschlagen",
        details: error.message
      })
    };
  }
};
