// Netlify Function als Proxy für die Analyse-API v2
// Umgeht CORS-Probleme durch Server-zu-Server Kommunikation

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_V2_URL = `${API_BASE}/api/v2/analyze`;
const API_V1_URL = `${API_BASE}/analyze`; // Fallback

exports.handler = async (event, context) => {
  // CORS Headers für alle Responses
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  // GET für Health-Check/Debugging
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "ok",
        message: "Netlify Function aktiv (API v2). Sende POST mit {text, context, options} für Analyse.",
        backend: API_V2_URL,
        version: "2.0"
      })
    };
  }

  // Nur POST für Analyse
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Body parsen und validieren
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Ungültiges JSON im Request-Body" })
      };
    }

    if (!requestBody.text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Kein Text angegeben" })
      };
    }

    // API v2 Request vorbereiten
    const apiRequest = {
      text: requestBody.text,
      context: requestBody.context || "private",
      options: {
        includeRewrite: true,
        ...requestBody.options
      }
    };

    console.log("Sende Anfrage an Backend API v2:", API_V2_URL);

    // Zuerst API v2 versuchen
    let response = await fetch(API_V2_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequest)
    });

    // Fallback auf API v1 wenn v2 nicht verfügbar (404)
    if (response.status === 404) {
      console.log("API v2 nicht gefunden, Fallback auf v1:", API_V1_URL);
      response = await fetch(API_V1_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: requestBody.text })
      });
    }

    console.log("Backend Response Status:", response.status);

    // Prüfen ob Response OK ist
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend Error:", errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: "Backend-Fehler",
          status: response.status,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log("Backend Antwort erhalten:", data.riskScore ? "API v2" : "API v1");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Proxy Error:", error.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: "Verbindung zum Backend fehlgeschlagen",
        details: error.message,
        backend: API_V2_URL
      })
    };
  }
};
