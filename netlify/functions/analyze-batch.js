// Netlify Function für Batch-Analyse API v2
// Proxy für die Batch-Analyse mit paralleler Verarbeitung

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_BATCH_URL = `${API_BASE}/api/v2/analyze/batch`;

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

    // Validiere texts Array
    if (!requestBody.texts || !Array.isArray(requestBody.texts)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "texts Array erforderlich" })
      };
    }

    if (requestBody.texts.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Mindestens ein Text erforderlich" })
      };
    }

    if (requestBody.texts.length > 20) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Maximal 20 Texte erlaubt" })
      };
    }

    const apiRequest = {
      texts: requestBody.texts.map((item, i) => ({
        id: item.id || `text-${i}`,
        text: typeof item === 'string' ? item : item.text,
        metadata: item.metadata || {}
      })),
      options: {
        parallel: requestBody.options?.parallel !== false,
        maxConcurrent: Math.min(requestBody.options?.maxConcurrent || 5, 10),
        failFast: requestBody.options?.failFast || false
      }
    };

    console.log("Batch Request:", apiRequest.texts.length, "Texte");

    const response = await fetch(API_BATCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Batch API Error:", errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: "Batch-Analyse fehlgeschlagen",
          status: response.status,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log("Batch erfolgreich:", data.results?.length || 0, "Ergebnisse");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Batch Proxy Error:", error.message);
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
