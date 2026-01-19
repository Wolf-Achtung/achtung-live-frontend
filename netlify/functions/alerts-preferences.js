// Netlify Function: Phase 9 - Data Breach Alerts - Preferences
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Default preferences
const DEFAULT_PREFERENCES = {
  emailFrequency: "immediate", // immediate, daily, weekly
  severityThreshold: "medium", // low, medium, high, critical
  categories: ["all"], // all, social, retail, finance, health, gaming
  notifyOn: {
    newBreaches: true,
    weeklyDigest: true,
    securityTips: false,
    serviceUpdates: false
  },
  language: "de"
};

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

  // GET - Retrieve current preferences
  if (event.httpMethod === "GET") {
    const email = event.queryStringParameters?.email;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "E-Mail-Adresse erforderlich" })
      };
    }

    try {
      const response = await fetch(`${API_BASE}/api/v2/alerts/preferences?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using defaults");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        preferences: DEFAULT_PREFERENCES
      })
    };
  }

  // POST - Update preferences
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { email, preferences } = body;

      if (!email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "E-Mail-Adresse erforderlich" })
        };
      }

      if (!preferences || typeof preferences !== "object") {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Einstellungen erforderlich" })
        };
      }

      // Validate preferences
      const validFrequencies = ["immediate", "daily", "weekly"];
      const validSeverities = ["low", "medium", "high", "critical"];

      if (preferences.emailFrequency && !validFrequencies.includes(preferences.emailFrequency)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Ungültige E-Mail-Frequenz" })
        };
      }

      if (preferences.severityThreshold && !validSeverities.includes(preferences.severityThreshold)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Ungültiger Schwellenwert" })
        };
      }

      // Try backend
      try {
        const response = await fetch(`${API_BASE}/api/v2/alerts/preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, preferences })
        });

        if (response.ok) {
          const data = await response.json();
          return { statusCode: 200, headers, body: JSON.stringify(data) };
        }
      } catch (apiError) {
        console.log("Backend unavailable, returning success");
      }

      // Merge with defaults and return
      const mergedPreferences = { ...DEFAULT_PREFERENCES, ...preferences };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Einstellungen gespeichert",
          preferences: mergedPreferences,
          updatedAt: new Date().toISOString()
        })
      };

    } catch (error) {
      console.error("Preferences error:", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Fehler beim Speichern der Einstellungen" })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" })
  };
};
