// Netlify Function als Proxy für die Predictive Privacy API
// Phase 5: Predictive Privacy Analysis

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_PREDICTIVE_URL = `${API_BASE}/api/v2/analyze/predictive`;

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
        message: "Predictive Privacy API Proxy aktiv. Sende POST mit {text, lang, options} für Analyse.",
        backend: API_PREDICTIVE_URL,
        version: "5.0"
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

    // API Request vorbereiten
    const apiRequest = {
      text: requestBody.text,
      lang: requestBody.lang || "de",
      options: {
        deanonymization: true,
        breachSimulation: true,
        futureRisk: true,
        correlationAttack: true,
        timeHorizons: [1, 5, 10],
        ...requestBody.options
      }
    };

    console.log("Sende Anfrage an Predictive API:", API_PREDICTIVE_URL);

    const response = await fetch(API_PREDICTIVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequest)
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
    console.log("Predictive Analyse erfolgreich");

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
        backend: API_PREDICTIVE_URL
      })
    };
  }
};
