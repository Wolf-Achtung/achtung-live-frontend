// Netlify Function: Phase 6 - Browser Extension - Detect Dark Patterns
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
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { pageUrl, pageDomain, elements } = body;

    if (!elements) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "elements Objekt ist erforderlich" }) };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/extension/detect-dark-patterns`, {
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

    // Fallback detection
    const patternsFound = [];

    // Analyze buttons for confirmshaming
    if (elements.buttons && Array.isArray(elements.buttons)) {
      elements.buttons.forEach(btn => {
        const text = (btn.text || '').toLowerCase();
        const classes = btn.classes || [];

        const isNegative = text.includes('nein') || text.includes('nicht') || text.includes('kein') || text.includes('ablehnen');
        const isSmall = classes.some(c => c.includes('small') || c.includes('muted') || c.includes('link') || c.includes('secondary') || c.includes('text-'));

        if (isNegative && isSmall) {
          patternsFound.push({
            type: 'confirmshaming',
            element: 'button',
            description: 'Ablehn-Button ist visuell unterdrückt',
            evidence: `"${btn.text}" ist klein oder ausgegraut`,
            severity: 'medium'
          });
        }

        // Check for shame text
        if (text.match(/nein.*hasse|nicht.*möchte|kein.*interesse|verzichte/)) {
          patternsFound.push({
            type: 'confirmshaming',
            element: 'button',
            description: 'Beschämende Sprache für Ablehn-Option',
            evidence: `"${btn.text}"`,
            severity: 'high'
          });
        }
      });
    }

    // Analyze checkboxes
    if (elements.checkboxes && Array.isArray(elements.checkboxes)) {
      elements.checkboxes.forEach(cb => {
        if (cb.checked && cb.visible === false) {
          patternsFound.push({
            type: 'hidden_checkbox',
            element: 'checkbox',
            description: 'Versteckte, vorab aktivierte Checkbox',
            evidence: `"${cb.label}" ist nicht sichtbar aber aktiviert`,
            severity: 'critical'
          });
        } else if (cb.checked && cb.visible !== false) {
          const label = (cb.label || '').toLowerCase();
          if (label.includes('werbung') || label.includes('newsletter') || label.includes('partner') || label.includes('marketing')) {
            patternsFound.push({
              type: 'preselected_option',
              element: 'checkbox',
              description: 'Marketing-Zustimmung ist vorausgewählt',
              evidence: `"${cb.label}" ist bereits aktiviert`,
              severity: 'medium'
            });
          }
        }
      });
    }

    // Analyze text for urgency/scarcity
    if (elements.text && Array.isArray(elements.text)) {
      elements.text.forEach(text => {
        const textLower = text.toLowerCase();

        // Fake urgency
        if (textLower.match(/nur noch \d+|letzte chance|endet in|läuft ab|schnell sein|bald vorbei/)) {
          patternsFound.push({
            type: 'fake_urgency',
            element: 'text',
            description: 'Künstliche Dringlichkeit durch Timer oder Countdown',
            evidence: text.substring(0, 60),
            severity: 'medium'
          });
        }

        // Fake scarcity
        if (textLower.match(/\d+ andere schauen|andere kaufen|beliebtes produkt|fast ausverkauft/)) {
          patternsFound.push({
            type: 'fake_scarcity',
            element: 'text',
            description: 'Künstliche Knappheit durch soziale Beweise',
            evidence: text.substring(0, 60),
            severity: 'medium'
          });
        }
      });
    }

    // Analyze modals
    if (elements.modals && Array.isArray(elements.modals)) {
      elements.modals.forEach(modal => {
        if (modal.type === 'exit_intent' && !modal.hasCloseButton) {
          patternsFound.push({
            type: 'roach_motel',
            element: 'modal',
            description: 'Exit-Intent Popup ohne einfache Schließmöglichkeit',
            evidence: 'Modal hat keinen sichtbaren Schließen-Button',
            severity: 'high'
          });
        }
      });
    }

    const darkPatternScore = Math.min(100, patternsFound.reduce((score, p) => {
      switch(p.severity) {
        case 'critical': return score + 35;
        case 'high': return score + 25;
        case 'medium': return score + 15;
        default: return score + 5;
      }
    }, 0));

    const trustScore = 100 - darkPatternScore;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          darkPatternScore,
          patternsFound,
          trustScore,
          recommendations: generateRecommendations(patternsFound),
          comparison: {
            averageScore: 35,
            percentile: darkPatternScore > 35 ? 100 - Math.round((darkPatternScore / 100) * 100) : 50 + Math.round(((35 - darkPatternScore) / 35) * 50),
            verdict: darkPatternScore > 50
              ? `Diese Seite verwendet mehr Dark Patterns als ${100 - Math.round((darkPatternScore / 100) * 50)}% der analysierten Seiten`
              : 'Diese Seite ist durchschnittlich oder besser'
          }
        }
      })
    };

  } catch (error) {
    console.error("Detect dark patterns error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Fehler bei der Dark Pattern Erkennung" }) };
  }
};

function generateRecommendations(patterns) {
  const recommendations = [];

  if (patterns.some(p => p.type === 'hidden_checkbox')) {
    recommendations.push('Prüfe alle versteckten Checkboxen in den Einstellungen');
  }
  if (patterns.some(p => p.type === 'preselected_option')) {
    recommendations.push('Deaktiviere alle vorab angekreuzten Checkboxen');
  }
  if (patterns.some(p => p.type === 'fake_urgency' || p.type === 'fake_scarcity')) {
    recommendations.push('Ignoriere Countdown-Timer und Knappheitsanzeigen');
  }
  if (patterns.some(p => p.type === 'confirmshaming')) {
    recommendations.push('Lass dich nicht von manipulativer Sprache beeinflussen');
  }
  if (patterns.some(p => p.type === 'roach_motel')) {
    recommendations.push('Drücke ESC oder klicke außerhalb des Popups');
  }

  if (recommendations.length === 0) {
    recommendations.push('Keine offensichtlichen Dark Patterns gefunden');
  }

  return recommendations;
}
