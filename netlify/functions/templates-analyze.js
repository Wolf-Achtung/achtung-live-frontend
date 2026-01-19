// Netlify Function: Phase 11 - Privacy Templates - Text Analyzer
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Privacy analysis patterns
const ANALYSIS_PATTERNS = {
  name: {
    pattern: /\b[A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+\b/g,
    severity: "high",
    suggestion: "Entferne deinen echten Namen oder nutze einen Spitznamen"
  },
  age_exact: {
    pattern: /\b(\d{1,2})\s*(Jahre|J\.|years old|yo)\b/gi,
    severity: "medium",
    suggestion: "Alter weglassen oder nur Dekade angeben (z.B. '20er')"
  },
  birth_year: {
    pattern: /\b(19[5-9]\d|200\d|201\d|202\d)\b/g,
    severity: "medium",
    suggestion: "Geburtsjahr entfernen"
  },
  city: {
    pattern: /\b(Berlin|München|Hamburg|Köln|Frankfurt|Stuttgart|Düsseldorf|Wien|Zürich|Leipzig|Dresden|Hannover|Nürnberg|Bremen|Essen|Dortmund)\b/gi,
    severity: "high",
    suggestion: "Nur Land oder Region angeben, nicht die Stadt"
  },
  employer: {
    pattern: /\b(bei|@|für)\s+[A-ZÄÖÜ][a-zA-ZäöüßÄÖÜ]+(\s+[A-ZÄÖÜ][a-zA-ZäöüßÄÖÜ]+)?\b/gi,
    severity: "high",
    suggestion: "Nur Branche nennen statt konkretem Arbeitgeber"
  },
  email: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    severity: "critical",
    suggestion: "E-Mail-Adresse nicht in öffentlichen Profilen teilen"
  },
  phone: {
    pattern: /(\+49|0049|0)\s*[\d\s\-\/]{8,}/g,
    severity: "critical",
    suggestion: "Telefonnummer entfernen"
  },
  address: {
    pattern: /\b[A-ZÄÖÜ][a-zäöüß]+straße\s*\d+|[A-ZÄÖÜ][a-zäöüß]+weg\s*\d+|[A-ZÄÖÜ][a-zäöüß]+platz\s*\d+/gi,
    severity: "critical",
    suggestion: "Keine Adresse in öffentlichen Profilen"
  },
  birthday: {
    pattern: /\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\b/g,
    severity: "high",
    suggestion: "Geburtsdatum nicht teilen"
  }
};

function analyzeText(text, context) {
  let score = 100;
  const issues = [];

  for (const [type, config] of Object.entries(ANALYSIS_PATTERNS)) {
    const matches = text.match(config.pattern);
    if (matches) {
      const deduction = config.severity === "critical" ? 30 :
                       config.severity === "high" ? 20 :
                       config.severity === "medium" ? 10 : 5;

      score -= deduction * Math.min(matches.length, 3);

      issues.push({
        type: type,
        found: matches[0],
        count: matches.length,
        severity: config.severity,
        suggestion: config.suggestion
      });
    }
  }

  score = Math.max(0, score);

  // Generate improved version
  let improvedText = text;
  for (const issue of issues) {
    if (issue.type === "city") {
      improvedText = improvedText.replace(ANALYSIS_PATTERNS.city.pattern, "[Region]");
    } else if (issue.type === "name") {
      improvedText = improvedText.replace(ANALYSIS_PATTERNS.name.pattern, "[Name]");
    } else if (issue.type === "age_exact") {
      improvedText = improvedText.replace(ANALYSIS_PATTERNS.age_exact.pattern, "");
    } else if (issue.type === "email") {
      improvedText = improvedText.replace(ANALYSIS_PATTERNS.email.pattern, "[E-Mail]");
    } else if (issue.type === "phone") {
      improvedText = improvedText.replace(ANALYSIS_PATTERNS.phone.pattern, "[Telefon]");
    }
  }

  // Calculate grade
  const grade = score >= 90 ? "A" :
               score >= 75 ? "B" :
               score >= 60 ? "C" :
               score >= 40 ? "D" : "F";

  return {
    privacyScore: score,
    grade: grade,
    issues: issues,
    suggestedVersion: improvedText.trim(),
    improvedScore: Math.min(100, score + (issues.length * 15))
  };
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
    const { text, context: textContext } = body;

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Text erforderlich" })
      };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/templates/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context: textContext })
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using local analysis");
    }

    // Local analysis
    const analysis = analyzeText(text, textContext);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: analysis
      })
    };

  } catch (error) {
    console.error("Analyze error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler bei der Analyse" })
    };
  }
};
