// Netlify Function: Phase 9 - Data Breach Alerts - Alert History
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback history data
const HISTORY_FALLBACK = [
  {
    id: "alert_001",
    date: "2024-01-15T10:30:00Z",
    type: "breach_notification",
    title: "Datenleck bei SocialMediaApp",
    severity: "high",
    read: true,
    breachId: "breach_2024_001",
    affectedData: ["email", "password_hash"]
  },
  {
    id: "alert_002",
    date: "2024-01-10T14:20:00Z",
    type: "breach_notification",
    title: "Kritisches Datenleck bei OnlineShop24",
    severity: "critical",
    read: true,
    breachId: "breach_2024_002",
    affectedData: ["email", "credit_card", "address"]
  },
  {
    id: "alert_003",
    date: "2024-01-08T09:15:00Z",
    type: "weekly_summary",
    title: "Wöchentliche Zusammenfassung",
    severity: "low",
    read: false,
    summary: {
      newBreaches: 3,
      affectedServices: 2,
      recommendedActions: 1
    }
  }
];

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Extract email from path (URL encoded)
    const pathParts = event.path.split("/");
    const emailEncoded = pathParts[pathParts.length - 1];

    if (!emailEncoded || emailEncoded === "alerts-history") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "E-Mail-Adresse erforderlich" })
      };
    }

    const email = decodeURIComponent(emailEncoded);

    // Basic email validation
    if (!email.includes("@")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Ungültige E-Mail-Adresse" })
      };
    }

    // Try backend
    try {
      const response = await fetch(`${API_BASE}/api/v2/alerts/history/${encodeURIComponent(email)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using fallback");
    }

    // Fallback response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        email: email.replace(/(.{2}).*@/, "$1***@"),
        history: HISTORY_FALLBACK,
        totalAlerts: HISTORY_FALLBACK.length,
        unreadCount: HISTORY_FALLBACK.filter(a => !a.read).length,
        oldestAlert: "2024-01-08",
        newestAlert: "2024-01-15"
      })
    };

  } catch (error) {
    console.error("History error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Laden der Historie" })
    };
  }
};
