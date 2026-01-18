// Netlify Function als Proxy für die Digital Footprint Scanner API
// Phase 7: Digital Footprint Scanner

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_FOOTPRINT_URL = `${API_BASE}/api/v2/footprint/scan`;

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
        message: "Footprint Scanner API Proxy aktiv. Sende POST mit {email, name, username, phone, options} für Scan.",
        backend: API_FOOTPRINT_URL,
        version: "7.0"
      })
    };
  }

  // Nur POST für Scan
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

    if (!requestBody.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Keine E-Mail-Adresse angegeben" })
      };
    }

    // API Request vorbereiten
    const apiRequest = {
      email: requestBody.email,
      name: requestBody.name || "",
      username: requestBody.username || "",
      phone: requestBody.phone || "",
      options: {
        checkBreaches: true,
        checkPastebins: true,
        checkSocialMedia: true,
        checkDataBrokers: true,
        checkSearchEngines: false,
        deepScan: false,
        ...requestBody.options
      }
    };

    console.log("Sende Anfrage an Footprint API:", API_FOOTPRINT_URL);

    const response = await fetch(API_FOOTPRINT_URL, {
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
    console.log("Footprint Scan erfolgreich");

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
        backend: API_FOOTPRINT_URL
      })
    };
  }
};
