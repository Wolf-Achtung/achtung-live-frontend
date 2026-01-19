// Netlify Function: Phase 6 - Browser Extension - Analyze Cookies
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Known tracker domains
const KNOWN_TRACKERS = {
  'google-analytics.com': { name: 'Google Analytics', category: 'analytics', risk: 'medium' },
  'googletagmanager.com': { name: 'Google Tag Manager', category: 'analytics', risk: 'medium' },
  'facebook.com': { name: 'Facebook', category: 'marketing', risk: 'high' },
  'facebook.net': { name: 'Facebook SDK', category: 'marketing', risk: 'high' },
  'doubleclick.net': { name: 'DoubleClick', category: 'advertising', risk: 'high' },
  'googlesyndication.com': { name: 'Google Ads', category: 'advertising', risk: 'high' },
  'hotjar.com': { name: 'Hotjar', category: 'session_recording', risk: 'high' },
  'mouseflow.com': { name: 'Mouseflow', category: 'session_recording', risk: 'high' },
  'fullstory.com': { name: 'FullStory', category: 'session_recording', risk: 'high' },
  'criteo.com': { name: 'Criteo', category: 'advertising', risk: 'high' },
  'adroll.com': { name: 'AdRoll', category: 'advertising', risk: 'high' },
  'linkedin.com': { name: 'LinkedIn', category: 'marketing', risk: 'medium' },
  'twitter.com': { name: 'Twitter/X', category: 'marketing', risk: 'medium' },
  'segment.com': { name: 'Segment', category: 'cdp', risk: 'medium' },
  'mixpanel.com': { name: 'Mixpanel', category: 'analytics', risk: 'medium' }
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
    const { pageUrl, pageDomain, consentBanner, detectedTrackers, cookies } = body;

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/extension/analyze-cookies`, {
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
    const issues = [];

    // Analyze consent banner
    if (consentBanner) {
      if (consentBanner.found && !consentBanner.hasRejectAll) {
        issues.push({
          type: 'missing_reject_all',
          severity: 'high',
          description: 'Kein "Alle ablehnen" Button gefunden',
          gdprViolation: true
        });
      }

      if (consentBanner.acceptAllProminent && !consentBanner.rejectAllVisible) {
        issues.push({
          type: 'dark_pattern_consent',
          severity: 'medium',
          description: '"Alle akzeptieren" ist prominent, "Ablehnen" versteckt',
          gdprViolation: false
        });
      }
    }

    // Analyze trackers
    const trackerSummary = {
      declared: consentBanner?.declaredVendors || 0,
      detected: detectedTrackers?.length || 0,
      undeclared: 0,
      categories: {}
    };

    const undeclaredTrackers = [];

    if (detectedTrackers && Array.isArray(detectedTrackers)) {
      detectedTrackers.forEach(tracker => {
        const domain = tracker.domain || '';
        const knownTracker = Object.entries(KNOWN_TRACKERS).find(([key]) => domain.includes(key));

        if (knownTracker) {
          const category = knownTracker[1].category;
          trackerSummary.categories[category] = (trackerSummary.categories[category] || 0) + 1;
        } else if (tracker.type === 'unknown') {
          undeclaredTrackers.push(domain);
          trackerSummary.undeclared++;
        }
      });
    }

    if (undeclaredTrackers.length > 0) {
      issues.push({
        type: 'undeclared_trackers',
        severity: 'critical',
        description: `${undeclaredTrackers.length} nicht deklarierte Tracker gefunden`,
        trackers: undeclaredTrackers,
        gdprViolation: true
      });
    }

    // Analyze cookies
    if (cookies && Array.isArray(cookies)) {
      const longLivedCookies = cookies.filter(c => {
        if (!c.expiry) return false;
        const expiry = c.expiry.toLowerCase();
        return expiry.includes('year') || expiry.includes('jahr') ||
               (expiry.includes('month') && parseInt(expiry) > 12) ||
               (expiry.includes('monat') && parseInt(expiry) > 12);
      });

      if (longLivedCookies.length > 0) {
        issues.push({
          type: 'excessive_cookie_lifetime',
          severity: 'medium',
          description: 'Cookies mit übermäßig langer Lebensdauer (>1 Jahr)',
          cookies: longLivedCookies.map(c => `${c.name} (${c.expiry})`)
        });
      }
    }

    // Calculate compliance score
    const complianceScore = Math.max(0, 100 - issues.reduce((penalty, issue) => {
      switch(issue.severity) {
        case 'critical': return penalty + 35;
        case 'high': return penalty + 25;
        case 'medium': return penalty + 15;
        default: return penalty + 5;
      }
    }, 0));

    const complianceLevel = complianceScore > 70 ? 'good' : complianceScore > 40 ? 'medium' : 'poor';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          complianceScore,
          complianceLevel,
          issues,
          trackerSummary,
          recommendations: generateRecommendations(issues, consentBanner),
          autoRejectPossible: consentBanner?.found && !consentBanner?.hasRejectAll,
          autoRejectSelector: '.cookie-banner .btn-secondary, #reject-cookies, [data-action="reject"]'
        }
      })
    };

  } catch (error) {
    console.error("Analyze cookies error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Fehler bei der Cookie-Analyse" }) };
  }
};

function generateRecommendations(issues, banner) {
  const recommendations = [];

  if (issues.some(i => i.type === 'missing_reject_all')) {
    recommendations.push('Suche nach "Einstellungen" oder "Mehr Optionen" im Banner');
  }
  if (issues.some(i => i.type === 'undeclared_trackers')) {
    recommendations.push('Nutze einen Cookie-Blocker für nicht deklarierte Tracker');
  }
  if (issues.some(i => i.gdprViolation)) {
    recommendations.push('Diese Seite könnte gegen DSGVO verstoßen');
  }
  if (issues.some(i => i.type === 'excessive_cookie_lifetime')) {
    recommendations.push('Lösche Cookies regelmäßig oder nutze den privaten Modus');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cookie-Handling scheint DSGVO-konform zu sein');
  }

  return recommendations;
}
