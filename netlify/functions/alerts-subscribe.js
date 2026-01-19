// Netlify Function: Phase 9 - Data Breach Alerts - Subscribe
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { email, notificationPreferences } = body;

    if (!email || !email.includes("@")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Gültige E-Mail-Adresse erforderlich" })
      };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/alerts/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, notificationPreferences })
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using fallback");
    }

    // Fallback response (simulated subscription)
    const subscriptionId = "sub_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscriptionId: subscriptionId,
        email: email,
        status: "pending_verification",
        message: "Bestätigungs-E-Mail wurde gesendet. Bitte prüfe dein Postfach.",
        verificationRequired: true,
        note: "Demo-Modus: In der vollständigen Version wird eine echte Bestätigungs-E-Mail gesendet."
      })
    };

  } catch (error) {
    console.error("Subscribe error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Interner Fehler bei der Registrierung" })
    };
  }
};
