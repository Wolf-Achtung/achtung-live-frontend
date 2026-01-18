// Netlify Function als Proxy für die Breach Check API
// Phase 7: Digital Footprint Scanner - Breach Check

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_BREACH_CHECK_URL = `${API_BASE}/api/v2/footprint/breach-check`;

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "ok",
        message: "Breach Check API Proxy aktiv. Sende POST mit {email} für Check.",
        backend: API_BREACH_CHECK_URL,
        version: "7.0"
      })
    };
  }

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

    const apiRequest = {
      email: requestBody.email,
      includeDetails: requestBody.includeDetails !== false
    };

    console.log("Sende Anfrage an Breach Check API:", API_BREACH_CHECK_URL);

    const response = await fetch(API_BREACH_CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiRequest)
    });

    console.log("Backend Response Status:", response.status);

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
    console.log("Breach Check erfolgreich");

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
        backend: API_BREACH_CHECK_URL
      })
    };
  }
};
