// Netlify Function: Phase 11 - Privacy Templates - Customize
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Privacy analysis for customized templates
const RISKY_PATTERNS = {
  full_name: /\b[A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+\b/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+49|0049|0)\s*[\d\s\-\/]{8,}/g,
  city: /\b(Berlin|München|Hamburg|Köln|Frankfurt|Stuttgart|Düsseldorf|Wien|Zürich|Leipzig|Dresden|Hannover|Nürnberg|Bremen|Essen|Dortmund)\b/gi,
  age: /\b(\d{1,2})\s*(Jahre|J\.|years old|yo)\b/gi,
  address: /\b[A-ZÄÖÜ][a-zäöüß]+straße\s*\d+|[A-ZÄÖÜ][a-zäöüß]+weg\s*\d+/gi
};

function analyzeCustomization(text) {
  const warnings = [];

  for (const [type, pattern] of Object.entries(RISKY_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      warnings.push({
        type: type,
        found: matches[0],
        message: getWarningMessage(type)
      });
    }
  }

  return warnings;
}

function getWarningMessage(type) {
  const messages = {
    full_name: "Vollständiger Name erkannt - erwäge einen Spitznamen",
    email: "E-Mail-Adresse erkannt - prüfe ob nötig",
    phone: "Telefonnummer erkannt - nur wenn unbedingt erforderlich",
    city: "Stadt erkannt - Region oder Land wäre sicherer",
    age: "Alter erkannt - erwäge es wegzulassen",
    address: "Adresse erkannt - nur wenn unbedingt erforderlich"
  };
  return messages[type] || "Potenziell sensible Information erkannt";
}

function calculatePrivacyScore(text, warnings) {
  let score = 100;
  const deductions = {
    full_name: 20,
    email: 25,
    phone: 30,
    city: 15,
    age: 10,
    address: 35
  };

  warnings.forEach(w => {
    score -= deductions[w.type] || 10;
  });

  return Math.max(0, score);
}

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
    const { templateId, variantId, customizations } = body;

    if (!templateId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "templateId erforderlich" })
      };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/templates/customize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, variantId, customizations })
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using local customization");
    }

    // Local customization fallback
    // This requires knowing the template content, so we just analyze what we can
    let customizedContent = "";

    if (customizations && typeof customizations === "object") {
      // Build content from customizations
      customizedContent = Object.values(customizations).filter(v => v).join(" ");
    }

    const warnings = analyzeCustomization(customizedContent);
    const privacyScore = calculatePrivacyScore(customizedContent, warnings);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result: {
          templateId: templateId,
          variantId: variantId,
          customizations: customizations,
          privacyScore: privacyScore,
          privacyWarnings: warnings,
          copyReady: warnings.length === 0,
          note: warnings.length > 0 ? "Prüfe die Warnungen bevor du den Text verwendest" : "Text ist bereit zur Verwendung"
        }
      })
    };

  } catch (error) {
    console.error("Customize error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler bei der Anpassung" })
    };
  }
};
