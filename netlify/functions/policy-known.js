// Netlify Function als Proxy für die Known Services API
// Phase 13: Privacy Policy Analyzer - Known Services

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_KNOWN_URL = `${API_BASE}/api/v2/policy/known`;

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
        message: "Known Services API Proxy aktiv. Sende POST mit {domain} für Abfrage.",
        backend: API_KNOWN_URL,
        version: "13.0"
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

    if (!requestBody.domain) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Keine Domain angegeben" })
      };
    }

    const apiUrl = `${API_KNOWN_URL}/${encodeURIComponent(requestBody.domain)}`;
    console.log("Sende Anfrage an Known Services API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
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
    console.log("Known Service Abfrage erfolgreich");

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
        backend: API_KNOWN_URL
      })
    };
  }
};
