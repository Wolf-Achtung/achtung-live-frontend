// Netlify Function: Phase 6 - Browser Extension - Analyze Field
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback patterns for client-side analysis
const PATTERNS = {
  email: { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'high', type: 'email', message: 'E-Mail-Adresse erkannt' },
  phone: { regex: /(\+49|0049|0)\s*\d{2,4}[\s\-\/]?\d{3,}[\s\-\/]?\d{2,}/g, severity: 'high', type: 'phone', message: 'Telefonnummer erkannt' },
  iban: { regex: /[A-Z]{2}\d{2}[\s]?(?:\d{4}[\s]?){4,5}\d{0,2}/gi, severity: 'critical', type: 'iban', message: 'IBAN erkannt' },
  address: { regex: /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/g, severity: 'medium', type: 'address', message: 'Mögliche Adresse erkannt' },
  name_intro: { regex: /(?:ich bin|mein name ist|heiße)\s+([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/gi, severity: 'high', type: 'full_name', message: 'Vollständiger Name erkannt' }
};

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { text, fieldType, fieldName, pageUrl, pageDomain, context: fieldContext } = body;

    if (!text) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Text ist erforderlich" }) };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/extension/analyze-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using fallback");
    }

    // Fallback analysis
    const findings = [];

    for (const [key, pattern] of Object.entries(PATTERNS)) {
      const matches = text.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          const startPos = text.indexOf(match);
          findings.push({
            type: pattern.type,
            value: match,
            position: { start: startPos, end: startPos + match.length },
            severity: pattern.severity,
            suggestion: getSuggestion(pattern.type)
          });
        });
      }
    }

    const riskScore = Math.min(100, findings.reduce((score, f) => {
      switch(f.severity) {
        case 'critical': return score + 40;
        case 'high': return score + 25;
        case 'medium': return score + 15;
        default: return score + 5;
      }
    }, 0));

    const riskLevel = riskScore > 70 ? 'high' : riskScore > 30 ? 'medium' : 'low';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          riskScore,
          riskLevel,
          findings,
          quickActions: generateQuickActions(findings, text),
          safeToSend: riskScore < 30,
          warningMessage: riskScore >= 30 ? 'Dieser Text enthält sensible Informationen' : null
        },
        meta: {
          processingTime: Date.now() % 100,
          cached: false,
          mode: 'fallback'
        }
      })
    };

  } catch (error) {
    console.error("Analyze field error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Fehler bei der Analyse" }) };
  }
};

function getSuggestion(type) {
  const suggestions = {
    email: 'Verwende eine anonyme E-Mail-Adresse',
    phone: 'Telefonnummer entfernen oder anonymisieren',
    iban: 'IBAN niemals öffentlich teilen!',
    address: 'Vermeide genaue Ortsangaben',
    full_name: 'Verwende einen Spitznamen oder nur den Vornamen'
  };
  return suggestions[type] || 'Überprüfe diese Information';
}

function generateQuickActions(findings, text) {
  const actions = [];

  if (findings.some(f => f.type === 'email')) {
    actions.push({ action: 'remove_email', label: 'E-Mail entfernen', icon: '📧' });
  }
  if (findings.some(f => f.type === 'phone')) {
    actions.push({ action: 'remove_phone', label: 'Telefon entfernen', icon: '📱' });
  }
  if (findings.some(f => f.type === 'full_name')) {
    actions.push({ action: 'anonymize_name', label: 'Namen anonymisieren', icon: '👤' });
  }
  if (findings.length > 1) {
    actions.push({ action: 'anonymize_all', label: 'Alles anonymisieren', icon: '🛡️' });
  }

  return actions;
}
