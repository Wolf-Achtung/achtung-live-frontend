// Netlify Function: Phase 6 - Browser Extension - Tracker Database
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback tracker database
const TRACKER_DATABASE = {
  trackers: {
    'google-analytics.com': {
      name: 'Google Analytics',
      company: 'Google',
      category: 'analytics',
      risk: 'medium',
      cookies: ['_ga', '_gid', '_gat', '__utma', '__utmb', '__utmc', '__utmz'],
      description: 'Web-Analyse-Dienst für Nutzungsstatistiken'
    },
    'googletagmanager.com': {
      name: 'Google Tag Manager',
      company: 'Google',
      category: 'analytics',
      risk: 'medium',
      cookies: [],
      description: 'Tag-Management für andere Tracker'
    },
    'facebook.com': {
      name: 'Facebook Pixel',
      company: 'Meta',
      category: 'marketing',
      risk: 'high',
      cookies: ['_fbp', 'fr', 'datr', 'sb'],
      description: 'Tracking für Facebook-Werbung und Retargeting'
    },
    'facebook.net': {
      name: 'Facebook SDK',
      company: 'Meta',
      category: 'marketing',
      risk: 'high',
      cookies: ['_fbp'],
      description: 'Facebook JavaScript SDK'
    },
    'doubleclick.net': {
      name: 'DoubleClick',
      company: 'Google',
      category: 'advertising',
      risk: 'high',
      cookies: ['IDE', 'DSID', 'id'],
      description: 'Google Werbe-Tracking-Netzwerk'
    },
    'googlesyndication.com': {
      name: 'Google AdSense',
      company: 'Google',
      category: 'advertising',
      risk: 'high',
      cookies: [],
      description: 'Google Werbenetzwerk'
    },
    'googleadservices.com': {
      name: 'Google Ads',
      company: 'Google',
      category: 'advertising',
      risk: 'high',
      cookies: [],
      description: 'Google Werbedienste'
    },
    'hotjar.com': {
      name: 'Hotjar',
      company: 'Hotjar',
      category: 'session_recording',
      risk: 'high',
      cookies: ['_hjid', '_hjSessionUser', '_hjSession'],
      description: 'Session Recording und Heatmaps - zeichnet Nutzerbewegungen auf'
    },
    'mouseflow.com': {
      name: 'Mouseflow',
      company: 'Mouseflow',
      category: 'session_recording',
      risk: 'high',
      cookies: ['mf_user', 'mf_session'],
      description: 'Session Recording - nimmt Bildschirm auf'
    },
    'fullstory.com': {
      name: 'FullStory',
      company: 'FullStory',
      category: 'session_recording',
      risk: 'high',
      cookies: ['fs_uid'],
      description: 'Session Recording mit kompletter Aufzeichnung'
    },
    'clarity.ms': {
      name: 'Microsoft Clarity',
      company: 'Microsoft',
      category: 'session_recording',
      risk: 'high',
      cookies: ['_clck', '_clsk'],
      description: 'Session Recording von Microsoft'
    },
    'criteo.com': {
      name: 'Criteo',
      company: 'Criteo',
      category: 'advertising',
      risk: 'high',
      cookies: ['cto_bundle', 'cto_lwid'],
      description: 'Retargeting-Werbenetzwerk'
    },
    'adroll.com': {
      name: 'AdRoll',
      company: 'AdRoll',
      category: 'advertising',
      risk: 'high',
      cookies: ['__adroll', '__adroll_fpc'],
      description: 'Retargeting-Werbeplattform'
    },
    'linkedin.com': {
      name: 'LinkedIn Insight',
      company: 'Microsoft',
      category: 'marketing',
      risk: 'medium',
      cookies: ['li_sugr', 'bcookie', 'lidc'],
      description: 'LinkedIn Marketing und Analytics'
    },
    'twitter.com': {
      name: 'Twitter/X Pixel',
      company: 'X Corp',
      category: 'marketing',
      risk: 'medium',
      cookies: ['personalization_id', 'guest_id'],
      description: 'Twitter/X Werbe-Tracking'
    },
    'tiktok.com': {
      name: 'TikTok Pixel',
      company: 'ByteDance',
      category: 'marketing',
      risk: 'high',
      cookies: ['_tt_enable_cookie', '_ttp'],
      description: 'TikTok Werbe-Tracking'
    },
    'segment.com': {
      name: 'Segment',
      company: 'Twilio',
      category: 'cdp',
      risk: 'medium',
      cookies: ['ajs_anonymous_id', 'ajs_user_id'],
      description: 'Customer Data Platform'
    },
    'mixpanel.com': {
      name: 'Mixpanel',
      company: 'Mixpanel',
      category: 'analytics',
      risk: 'medium',
      cookies: ['mp_', 'mixpanel'],
      description: 'Product Analytics'
    },
    'amplitude.com': {
      name: 'Amplitude',
      company: 'Amplitude',
      category: 'analytics',
      risk: 'medium',
      cookies: ['amplitude_id'],
      description: 'Product Analytics Plattform'
    },
    'hubspot.com': {
      name: 'HubSpot',
      company: 'HubSpot',
      category: 'marketing',
      risk: 'medium',
      cookies: ['__hstc', '__hssc', 'hubspotutk'],
      description: 'Marketing Automation'
    }
  },
  categories: {
    analytics: {
      risk: 'medium',
      description: 'Nutzungsanalyse und Statistiken',
      gdprRelevant: true
    },
    marketing: {
      risk: 'high',
      description: 'Marketing, Retargeting und Werbung',
      gdprRelevant: true
    },
    advertising: {
      risk: 'high',
      description: 'Werbenetzwerke und Ad-Tracking',
      gdprRelevant: true
    },
    session_recording: {
      risk: 'high',
      description: 'Session Recording - zeichnet Bildschirmaktionen auf',
      gdprRelevant: true,
      warning: 'Diese Tracker können Passwörter und sensible Daten aufzeichnen!'
    },
    cdp: {
      risk: 'medium',
      description: 'Customer Data Platforms - sammeln Nutzerprofile',
      gdprRelevant: true
    },
    essential: {
      risk: 'low',
      description: 'Notwendige Funktionen (Login, Warenkorb)',
      gdprRelevant: false
    }
  },
  riskLevels: {
    low: { color: '#4caf50', label: 'Niedriges Risiko', description: 'Technisch notwendig' },
    medium: { color: '#ff9800', label: 'Mittleres Risiko', description: 'Sammelt Nutzungsdaten' },
    high: { color: '#f44336', label: 'Hohes Risiko', description: 'Umfassendes Tracking, Profilbildung' }
  },
  version: '1.0',
  totalTrackers: 20,
  lastUpdated: new Date().toISOString().split('T')[0]
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=86400" // Cache for 24 hours
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/extension/tracker-database`, {
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

    // Return fallback database
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(TRACKER_DATABASE)
    };

  } catch (error) {
    console.error("Tracker database error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Fehler beim Laden der Tracker-Datenbank" }) };
  }
};
