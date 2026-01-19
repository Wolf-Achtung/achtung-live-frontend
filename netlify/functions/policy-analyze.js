// Netlify Function als Proxy für die Privacy Policy Analyzer API
// Phase 13: Privacy Policy Analyzer

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_POLICY_URL = `${API_BASE}/api/v2/policy/analyze`;

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
        message: "Privacy Policy Analyzer API Proxy aktiv. Sende POST mit {type, value} für Analyse.",
        backend: API_POLICY_URL,
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

    if (!requestBody.type || !requestBody.value) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Bitte type (url/text) und value angeben" })
      };
    }

    const apiRequest = {
      type: requestBody.type,
      value: requestBody.value,
      options: requestBody.options || {}
    };

    console.log("Sende Anfrage an Policy Analyze API:", API_POLICY_URL);

    const response = await fetch(API_POLICY_URL, {
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
    console.log("Policy Analyse erfolgreich");

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
        backend: API_POLICY_URL
      })
    };
  }
};
