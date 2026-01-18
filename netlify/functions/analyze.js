// Netlify Function als Proxy für die Analyse-API
// Umgeht CORS-Probleme durch Server-zu-Server Kommunikation

const API_URL = "https://achtung-live-backend-production.up.railway.app/analyze";

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
        message: "Netlify Function aktiv. Sende POST mit {text: '...'} für Analyse.",
        backend: API_URL
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

    console.log("Sende Anfrage an Backend:", API_URL);

    // Request an das Backend weiterleiten
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: requestBody.text })
    });

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
    console.log("Backend Antwort erhalten");

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
        backend: API_URL
      })
    };
  }
};
