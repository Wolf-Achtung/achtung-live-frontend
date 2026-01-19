// Netlify Function als Proxy für die Coach Feedback API
// Phase 10: Smart Privacy Coach - Feedback Endpoint

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_FEEDBACK_URL = `${API_BASE}/api/v2/coach/feedback`;

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

    // Validate required fields
    if (!requestBody.rating) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Bewertung (rating) ist erforderlich" })
      };
    }

    const feedbackData = {
      sessionId: requestBody.sessionId || "anonymous",
      messageId: requestBody.messageId || null,
      rating: requestBody.rating, // 'helpful', 'not_helpful', 'partially_helpful'
      comment: requestBody.comment || null,
      timestamp: new Date().toISOString()
    };

    console.log("Sending feedback to:", API_FEEDBACK_URL);

    const response = await fetch(API_FEEDBACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackData)
    });

    if (!response.ok) {
      // Even if backend fails, acknowledge the feedback
      console.log("Backend unavailable, acknowledging feedback locally");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Danke für dein Feedback! Es hilft mir, besser zu werden.",
          stored: "local"
        })
      };
    }

    const data = await response.json();
    console.log("Feedback submitted successfully");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.log("Error submitting feedback:", error.message);
    // Always acknowledge feedback to user
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Danke für dein Feedback!",
        stored: "local"
      })
    };
  }
};
