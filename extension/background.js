// achtung.live Guard - Background Service Worker
// Phase 6: Browser Extension Pro

const API_BASE = 'https://achtung.live/.netlify/functions';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Default Settings
const DEFAULT_SETTINGS = {
  enabled: true,
  liveTypingGuard: true,
  formAnalysis: true,
  darkPatternDetection: true,
  cookieAnalysis: true,
  notificationLevel: 'medium',
  autoRejectCookies: false,
  whitelist: [],
  blacklist: []
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[achtung.live] Extension installed:', details.reason);

  // Set default settings on first install
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      settings: DEFAULT_SETTINGS,
      stats: {
        totalAnalyses: 0,
        warningsShown: 0,
        darkPatternsDetected: 0,
        trackersBlocked: 0,
        formsAnalyzed: 0,
        installDate: new Date().toISOString()
      },
      cache: {},
      siteData: {}
    });

    // Fetch and cache dark patterns database
    await updateDarkPatternsCache();
    await updateTrackerDatabase();
  }

  // Show welcome page on install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'https://achtung.live/extension-welcome'
    });
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  const { type, payload } = message;

  switch (type) {
    case 'ANALYZE_FIELD':
      return await analyzeField(payload);

    case 'ANALYZE_FORM':
      return await analyzeForm(payload);

    case 'DETECT_DARK_PATTERNS':
      return await detectDarkPatterns(payload);

    case 'ANALYZE_COOKIES':
      return await analyzeCookies(payload);

    case 'GET_SETTINGS':
      return await getSettings();

    case 'UPDATE_SETTINGS':
      return await updateSettings(payload);

    case 'GET_STATS':
      return await getStats();

    case 'INCREMENT_STAT':
      return await incrementStat(payload.stat);

    case 'GET_SITE_DATA':
      return await getSiteData(payload.domain);

    case 'UPDATE_SITE_DATA':
      return await updateSiteData(payload.domain, payload.data);

    case 'GET_DARK_PATTERNS_DB':
      return await getDarkPatternsDB();

    case 'GET_TRACKER_DB':
      return await getTrackerDB();

    default:
      console.warn('[achtung.live] Unknown message type:', type);
      return { error: 'Unknown message type' };
  }
}

// ========================================
// API Functions
// ========================================

async function analyzeField(payload) {
  try {
    const settings = await getSettings();
    if (!settings.enabled || !settings.liveTypingGuard) {
      return { skipped: true, reason: 'disabled' };
    }

    // Check whitelist
    if (settings.whitelist.includes(payload.pageDomain)) {
      return { skipped: true, reason: 'whitelisted' };
    }

    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: payload.text,
        context: payload.context || 'public'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    await incrementStat('totalAnalyses');

    if (data.riskScore > 30) {
      await incrementStat('warningsShown');
    }

    return {
      success: true,
      data: {
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        findings: data.categories || [],
        safeToSend: data.riskScore < 30,
        quickActions: generateQuickActions(data)
      }
    };

  } catch (error) {
    console.error('[achtung.live] Field analysis error:', error);
    // Fallback to client-side analysis
    return analyzeFieldClientSide(payload);
  }
}

function analyzeFieldClientSide(payload) {
  const text = payload.text || '';
  const findings = [];

  // Simple pattern detection
  const patterns = {
    email: { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'high', message: 'E-Mail-Adresse erkannt' },
    phone: { regex: /(\+49|0049|0)\s*\d{2,4}[\s\-\/]?\d{3,}[\s\-\/]?\d{2,}/g, severity: 'high', message: 'Telefonnummer erkannt' },
    iban: { regex: /[A-Z]{2}\d{2}[\s]?(?:\d{4}[\s]?){4,5}\d{0,2}/gi, severity: 'critical', message: 'IBAN erkannt' },
    address: { regex: /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/g, severity: 'medium', message: 'Mögliche Adresse erkannt' },
    name_intro: { regex: /(?:ich bin|mein name ist|heiße)\s+([A-ZÄÖÜ][a-zäöüß]+)/gi, severity: 'medium', message: 'Namensnennung erkannt' }
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern.regex);
    if (matches) {
      matches.forEach(match => {
        findings.push({
          type,
          value: match,
          severity: pattern.severity,
          message: pattern.message
        });
      });
    }
  }

  const riskScore = Math.min(100, findings.length * 25);

  return {
    success: true,
    data: {
      riskScore,
      riskLevel: riskScore > 70 ? 'high' : riskScore > 30 ? 'medium' : 'low',
      findings,
      safeToSend: riskScore < 30,
      mode: 'client-side'
    }
  };
}

function generateQuickActions(data) {
  const actions = [];

  if (data.categories?.some(c => c.type === 'email')) {
    actions.push({
      action: 'remove_email',
      label: 'E-Mail entfernen',
      icon: '📧'
    });
  }

  if (data.categories?.some(c => c.type === 'phone' || c.type === 'telefon')) {
    actions.push({
      action: 'remove_phone',
      label: 'Telefonnummer entfernen',
      icon: '📱'
    });
  }

  if (data.riskScore > 50) {
    actions.push({
      action: 'anonymize_all',
      label: 'Alles anonymisieren',
      icon: '🛡️'
    });
  }

  return actions;
}

async function analyzeForm(payload) {
  try {
    const settings = await getSettings();
    if (!settings.enabled || !settings.formAnalysis) {
      return { skipped: true, reason: 'disabled' };
    }

    await incrementStat('formsAnalyzed');

    // Client-side form analysis
    const { formFields } = payload;
    const sensitiveFields = [];
    const unusualFields = [];

    const sensitiveTypes = ['ssn', 'social_security', 'tax_id', 'passport', 'mother_maiden', 'income', 'salary', 'credit_card'];
    const sensitiveLabels = ['sozialversicherung', 'steuernummer', 'ausweis', 'mädchenname', 'einkommen', 'gehalt', 'kreditkarte', 'geburtsort'];

    formFields.forEach(field => {
      const nameAndLabel = (field.name + ' ' + (field.label || '')).toLowerCase();

      // Check for sensitive fields
      if (sensitiveTypes.some(t => nameAndLabel.includes(t)) ||
          sensitiveLabels.some(l => nameAndLabel.includes(l))) {
        sensitiveFields.push(field);
        unusualFields.push({
          field: field.name,
          label: field.label,
          reason: 'Dieses Feld sammelt besonders sensible Daten',
          severity: 'high'
        });
      }

      // Check for unusual combinations
      if (field.type === 'password' && !nameAndLabel.includes('password') && !nameAndLabel.includes('passwort')) {
        unusualFields.push({
          field: field.name,
          label: field.label,
          reason: 'Verstecktes Passwortfeld',
          severity: 'critical'
        });
      }
    });

    const formRiskScore = Math.min(100, unusualFields.length * 30 + sensitiveFields.length * 15);

    return {
      success: true,
      data: {
        formRiskScore,
        riskLevel: formRiskScore > 60 ? 'high' : formRiskScore > 30 ? 'medium' : 'low',
        totalFields: formFields.length,
        sensitiveFields: sensitiveFields.length,
        unusualFields,
        recommendations: generateFormRecommendations(unusualFields)
      }
    };

  } catch (error) {
    console.error('[achtung.live] Form analysis error:', error);
    return { error: error.message };
  }
}

function generateFormRecommendations(unusualFields) {
  const recommendations = [];

  if (unusualFields.some(f => f.severity === 'critical')) {
    recommendations.push('⚠️ Dieses Formular enthält verdächtige Felder - Vorsicht!');
  }

  if (unusualFields.some(f => f.field?.includes('ssn') || f.field?.includes('social'))) {
    recommendations.push('Frage nach, warum Sozialversicherungsnummer benötigt wird');
  }

  if (unusualFields.length > 2) {
    recommendations.push('Dieses Formular sammelt ungewöhnlich viele sensible Daten');
    recommendations.push('Prüfe die Datenschutzerklärung vor dem Absenden');
  }

  if (recommendations.length === 0) {
    recommendations.push('Formular scheint normal zu sein');
  }

  return recommendations;
}

async function detectDarkPatterns(payload) {
  try {
    const settings = await getSettings();
    if (!settings.enabled || !settings.darkPatternDetection) {
      return { skipped: true, reason: 'disabled' };
    }

    const patterns = [];
    const { elements } = payload;

    // Analyze buttons for confirmshaming
    if (elements.buttons) {
      elements.buttons.forEach(btn => {
        const text = btn.text.toLowerCase();
        const isNegative = text.includes('nein') || text.includes('nicht') || text.includes('kein');
        const isSmallOrMuted = btn.classes.some(c =>
          c.includes('small') || c.includes('muted') || c.includes('link') || c.includes('secondary')
        );

        if (isNegative && isSmallOrMuted) {
          patterns.push({
            type: 'confirmshaming',
            severity: 'medium',
            description: 'Ablehn-Button ist visuell unterdrückt',
            element: btn.text
          });
        }
      });
    }

    // Analyze checkboxes
    if (elements.checkboxes) {
      elements.checkboxes.forEach(cb => {
        if (cb.checked && !cb.visible) {
          patterns.push({
            type: 'hidden_checkbox',
            severity: 'critical',
            description: 'Versteckte, vorab aktivierte Checkbox',
            element: cb.label
          });
          incrementStat('darkPatternsDetected');
        } else if (cb.checked) {
          patterns.push({
            type: 'preselected_option',
            severity: 'low',
            description: 'Vorab aktivierte Checkbox',
            element: cb.label
          });
        }
      });
    }

    // Analyze text for fake urgency
    if (elements.text) {
      elements.text.forEach(text => {
        const textLower = text.toLowerCase();
        if (textLower.match(/nur noch \d+|letzte chance|endet in|andere schauen|schnell sein/)) {
          patterns.push({
            type: 'fake_urgency',
            severity: 'medium',
            description: 'Künstliche Dringlichkeit',
            element: text
          });
        }
      });
    }

    const darkPatternScore = Math.min(100, patterns.length * 20);
    if (patterns.length > 0) {
      await incrementStat('darkPatternsDetected');
    }

    return {
      success: true,
      data: {
        darkPatternScore,
        patternsFound: patterns,
        trustScore: 100 - darkPatternScore,
        recommendations: patterns.length > 0 ?
          ['Sei vorsichtig bei Entscheidungen auf dieser Seite', 'Prüfe alle Checkboxen vor dem Absenden'] :
          ['Keine offensichtlichen Dark Patterns gefunden']
      }
    };

  } catch (error) {
    console.error('[achtung.live] Dark pattern detection error:', error);
    return { error: error.message };
  }
}

async function analyzeCookies(payload) {
  try {
    const settings = await getSettings();
    if (!settings.enabled || !settings.cookieAnalysis) {
      return { skipped: true, reason: 'disabled' };
    }

    const issues = [];
    const { consentBanner, detectedTrackers } = payload;

    // Check consent banner
    if (consentBanner) {
      if (!consentBanner.hasRejectAll) {
        issues.push({
          type: 'missing_reject_all',
          severity: 'high',
          description: 'Kein "Alle ablehnen" Button gefunden'
        });
      }

      if (consentBanner.acceptAllProminent && !consentBanner.rejectAllVisible) {
        issues.push({
          type: 'dark_pattern_consent',
          severity: 'medium',
          description: '"Akzeptieren" ist prominent, "Ablehnen" versteckt'
        });
      }
    }

    // Check trackers
    const trackerDB = await getTrackerDB();
    const unknownTrackers = detectedTrackers?.filter(t =>
      !trackerDB?.trackers?.[t.domain] && t.type === 'unknown'
    ) || [];

    if (unknownTrackers.length > 0) {
      issues.push({
        type: 'undeclared_trackers',
        severity: 'critical',
        description: `${unknownTrackers.length} unbekannte Tracker gefunden`,
        trackers: unknownTrackers.map(t => t.domain)
      });
      await incrementStat('trackersBlocked');
    }

    const complianceScore = Math.max(0, 100 - issues.length * 25);

    return {
      success: true,
      data: {
        complianceScore,
        complianceLevel: complianceScore > 70 ? 'good' : complianceScore > 40 ? 'medium' : 'poor',
        issues,
        trackerSummary: {
          detected: detectedTrackers?.length || 0,
          unknown: unknownTrackers.length
        },
        recommendations: issues.length > 0 ?
          ['Nutze die "Einstellungen" Option im Cookie-Banner', 'Erwäge einen Cookie-Blocker'] :
          ['Cookie-Handling scheint in Ordnung']
      }
    };

  } catch (error) {
    console.error('[achtung.live] Cookie analysis error:', error);
    return { error: error.message };
  }
}

// ========================================
// Storage Functions
// ========================================

async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

async function updateSettings(newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  await chrome.storage.local.set({ settings: updated });
  return updated;
}

async function getStats() {
  const result = await chrome.storage.local.get('stats');
  return result.stats || {};
}

async function incrementStat(stat) {
  const stats = await getStats();
  stats[stat] = (stats[stat] || 0) + 1;
  await chrome.storage.local.set({ stats });
  return stats;
}

async function getSiteData(domain) {
  const result = await chrome.storage.local.get('siteData');
  return result.siteData?.[domain] || null;
}

async function updateSiteData(domain, data) {
  const result = await chrome.storage.local.get('siteData');
  const siteData = result.siteData || {};
  siteData[domain] = { ...siteData[domain], ...data, lastVisit: new Date().toISOString() };
  await chrome.storage.local.set({ siteData });
  return siteData[domain];
}

// ========================================
// Cache Functions
// ========================================

async function getDarkPatternsDB() {
  const result = await chrome.storage.local.get('cache');
  const cache = result.cache || {};

  if (cache.darkPatterns && Date.now() - cache.darkPatternsUpdated < CACHE_DURATION) {
    return cache.darkPatterns;
  }

  return await updateDarkPatternsCache();
}

async function updateDarkPatternsCache() {
  try {
    // For now, use built-in patterns
    const darkPatterns = {
      patterns: [
        { id: 'confirmshaming', name: 'Confirmshaming', keywords: ['nein.*hasse', 'nicht.*möchte'] },
        { id: 'fake_urgency', name: 'Künstliche Dringlichkeit', keywords: ['nur noch', 'endet in', 'letzte chance'] },
        { id: 'hidden_checkbox', name: 'Versteckte Checkbox', detection: 'visibility' },
        { id: 'preselected_option', name: 'Vorausgewählt', detection: 'checked' },
        { id: 'roach_motel', name: 'Roach Motel', keywords: ['kündigung.*telefon', 'schriftlich'] }
      ],
      version: '1.0',
      lastUpdated: new Date().toISOString()
    };

    const result = await chrome.storage.local.get('cache');
    const cache = result.cache || {};
    cache.darkPatterns = darkPatterns;
    cache.darkPatternsUpdated = Date.now();
    await chrome.storage.local.set({ cache });

    return darkPatterns;
  } catch (error) {
    console.error('[achtung.live] Failed to update dark patterns cache:', error);
    return null;
  }
}

async function getTrackerDB() {
  const result = await chrome.storage.local.get('cache');
  const cache = result.cache || {};

  if (cache.trackerDB && Date.now() - cache.trackerDBUpdated < CACHE_DURATION) {
    return cache.trackerDB;
  }

  return await updateTrackerDatabase();
}

async function updateTrackerDatabase() {
  try {
    // Built-in tracker database
    const trackerDB = {
      trackers: {
        'google-analytics.com': { name: 'Google Analytics', category: 'analytics', risk: 'medium' },
        'googletagmanager.com': { name: 'Google Tag Manager', category: 'analytics', risk: 'medium' },
        'facebook.com': { name: 'Facebook', category: 'marketing', risk: 'high' },
        'facebook.net': { name: 'Facebook SDK', category: 'marketing', risk: 'high' },
        'doubleclick.net': { name: 'DoubleClick', category: 'advertising', risk: 'high' },
        'hotjar.com': { name: 'Hotjar', category: 'analytics', risk: 'medium' },
        'mouseflow.com': { name: 'Mouseflow', category: 'analytics', risk: 'medium' },
        'criteo.com': { name: 'Criteo', category: 'advertising', risk: 'high' },
        'adroll.com': { name: 'AdRoll', category: 'advertising', risk: 'high' }
      },
      categories: {
        analytics: { risk: 'medium', description: 'Nutzungsanalyse' },
        marketing: { risk: 'high', description: 'Marketing & Retargeting' },
        advertising: { risk: 'high', description: 'Werbenetzwerke' }
      },
      version: '1.0',
      lastUpdated: new Date().toISOString()
    };

    const result = await chrome.storage.local.get('cache');
    const cache = result.cache || {};
    cache.trackerDB = trackerDB;
    cache.trackerDBUpdated = Date.now();
    await chrome.storage.local.set({ cache });

    return trackerDB;
  } catch (error) {
    console.error('[achtung.live] Failed to update tracker database:', error);
    return null;
  }
}

// ========================================
// Badge Updates
// ========================================

function updateBadge(tabId, riskLevel, count) {
  const colors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
    critical: '#9c27b0'
  };

  chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ tabId, color: colors[riskLevel] || colors.low });
}

// Listen for tab updates to reset badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
});

console.log('[achtung.live] Background service worker initialized');
