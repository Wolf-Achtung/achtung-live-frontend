// achtung.live Guard - Content Script
// Injected into every page for real-time protection

(function() {
  'use strict';

  const CONFIG = {
    debounceMs: 500,
    minTextLength: 10,
    warningThreshold: 30,
    highRiskThreshold: 70
  };

  let settings = null;
  let isInitialized = false;

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('[achtung.live] Content script initializing...');

    settings = await sendMessage({ type: 'GET_SETTINGS' });

    if (!settings?.enabled) {
      console.log('[achtung.live] Extension disabled');
      return;
    }

    setupInputObservers();
    setupFormObservers();

    if (settings.darkPatternDetection) {
      detectDarkPatternsOnPage();
    }

    if (settings.cookieAnalysis) {
      analyzeCookieBanner();
    }

    console.log('[achtung.live] Content script initialized');
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED') {
      settings = message.payload;
    }
    if (message.type === 'SCAN_PAGE') {
      scanCurrentPage().then(sendResponse);
      return true;
    }
  });

  const inputTimeouts = new WeakMap();
  const inputWarnings = new WeakMap();

  function setupInputObservers() {
    document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(attachInputListener);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (isTextInput(node)) attachInputListener(node);
            node.querySelectorAll?.('input[type="text"], input[type="email"], textarea')
              .forEach(attachInputListener);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function isTextInput(element) {
    return element.tagName === 'TEXTAREA' ||
           (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(element.type));
  }

  function attachInputListener(input) {
    if (input.dataset.achtungMonitored) return;
    input.dataset.achtungMonitored = 'true';

    input.addEventListener('input', (e) => {
      if (!settings?.liveTypingGuard) return;
      const existingTimeout = inputTimeouts.get(input);
      if (existingTimeout) clearTimeout(existingTimeout);
      const timeout = setTimeout(() => analyzeInput(input), CONFIG.debounceMs);
      inputTimeouts.set(input, timeout);
    });

    input.addEventListener('blur', (e) => {
      if (input.value.length >= CONFIG.minTextLength) {
        analyzeInput(input);
      }
    });
  }

  async function analyzeInput(input) {
    const text = input.value.trim();
    if (text.length < CONFIG.minTextLength) {
      hideWarning(input);
      return;
    }

    const result = await sendMessage({
      type: 'ANALYZE_FIELD',
      payload: {
        text,
        fieldType: input.tagName.toLowerCase(),
        fieldName: input.name || input.id,
        pageUrl: window.location.href,
        pageDomain: window.location.hostname
      }
    });

    if (result?.skipped) return;
    if (result?.data) updateInputWarning(input, result.data);
  }

  function updateInputWarning(input, data) {
    const { riskScore, riskLevel, findings, safeToSend } = data;
    if (riskScore < CONFIG.warningThreshold) {
      hideWarning(input);
      showSafeIndicator(input);
      return;
    }
    showWarning(input, { riskScore, riskLevel, findings, safeToSend });
  }

  function showWarning(input, data) {
    hideWarning(input);
    hideSafeIndicator(input);

    const warning = document.createElement('div');
    warning.className = 'achtung-warning';
    warning.dataset.riskLevel = data.riskLevel;

    const icon = data.riskLevel === 'high' ? '!' : '!';
    const findingsHtml = data.findings.slice(0, 3).map(f =>
      '<div class="achtung-finding"><span class="achtung-finding-icon">' + getTypeIcon(f.type) + '</span> ' + (f.message || f.type) + '</div>'
    ).join('');

    warning.innerHTML = 
      '<div class="achtung-warning-header">' +
        '<span class="achtung-warning-icon">' + icon + '</span>' +
        '<span class="achtung-warning-title">achtung.live</span>' +
        '<span class="achtung-warning-score">' + data.riskScore + '%</span>' +
        '<button class="achtung-warning-close" title="Schliessen">&times;</button>' +
      '</div>' +
      '<div class="achtung-warning-body">' + findingsHtml + '</div>' +
      '<div class="achtung-warning-footer">' +
        '<span class="achtung-warning-hint">Sensible Daten erkannt - pruefe vor dem Absenden</span>' +
      '</div>';

    warning.querySelector('.achtung-warning-close').addEventListener('click', () => hideWarning(input));
    positionWarning(input, warning);
    document.body.appendChild(warning);
    inputWarnings.set(input, warning);
  }

  function hideWarning(input) {
    const warning = inputWarnings.get(input);
    if (warning) {
      warning.remove();
      inputWarnings.delete(input);
    }
  }

  function showSafeIndicator(input) {
    if (input.dataset.achtungSafe) return;
    const indicator = document.createElement('span');
    indicator.className = 'achtung-safe-indicator';
    indicator.innerHTML = 'OK';
    indicator.title = 'Keine sensiblen Daten erkannt';
    input.dataset.achtungSafe = 'true';
    input.parentElement?.appendChild(indicator);
  }

  function hideSafeIndicator(input) {
    if (!input.dataset.achtungSafe) return;
    delete input.dataset.achtungSafe;
    input.parentElement?.querySelector('.achtung-safe-indicator')?.remove();
  }

  function positionWarning(input, warning) {
    const rect = input.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    warning.style.position = 'absolute';
    warning.style.top = (rect.bottom + scrollTop + 5) + 'px';
    warning.style.left = (rect.left + scrollLeft) + 'px';
    warning.style.maxWidth = Math.max(rect.width, 300) + 'px';
    warning.style.zIndex = '2147483647';
  }

  function getTypeIcon(type) {
    const icons = {
      email: 'M', phone: 'P', telefon: 'P', iban: 'B', address: 'A',
      adresse: 'A', name: 'N', full_name: 'N', name_intro: 'N',
      location: 'L', standort: 'L', health: 'H', gesundheit: 'H',
      financial: 'F', finanzen: 'F'
    };
    return '[' + (icons[type] || '!') + ']';
  }

  function setupFormObservers() {
    document.querySelectorAll('form').forEach(analyzeForm);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM') analyzeForm(node);
            node.querySelectorAll?.('form').forEach(analyzeForm);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function analyzeForm(form) {
    if (form.dataset.achtungAnalyzed) return;
    form.dataset.achtungAnalyzed = 'true';

    const formFields = Array.from(form.elements)
      .filter(el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')
      .map(el => ({
        name: el.name || el.id,
        type: el.type || el.tagName.toLowerCase(),
        required: el.required,
        label: getFieldLabel(el)
      }));

    if (formFields.length < 2) return;

    const result = await sendMessage({
      type: 'ANALYZE_FORM',
      payload: {
        formFields,
        formAction: form.action,
        pageUrl: window.location.href,
        pageDomain: window.location.hostname,
        pageTitle: document.title
      }
    });

    if (result?.data?.formRiskScore > 50) {
      showFormWarning(form, result.data);
    }
  }

  function getFieldLabel(field) {
    if (field.id) {
      const label = document.querySelector('label[for="' + field.id + '"]');
      if (label) return label.textContent.trim();
    }
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    return field.placeholder || field.name || '';
  }

  function showFormWarning(form, data) {
    const warning = document.createElement('div');
    warning.className = 'achtung-form-warning';

    const unusualFieldsHtml = data.unusualFields.slice(0, 3).map(f =>
      '<div class="achtung-unusual-field">' +
        '<span class="severity-' + f.severity + '">*</span> ' +
        '<strong>' + (f.label || f.field) + ':</strong> ' + f.reason +
      '</div>'
    ).join('');

    warning.innerHTML = 
      '<div class="achtung-form-warning-header">' +
        '<span>! achtung.live - Formular-Warnung</span>' +
        '<button class="achtung-warning-close">&times;</button>' +
      '</div>' +
      '<div class="achtung-form-warning-body">' +
        '<div class="achtung-form-score">Risiko-Score: <strong>' + data.formRiskScore + '%</strong></div>' +
        unusualFieldsHtml +
      '</div>' +
      '<div class="achtung-form-warning-footer">' +
        (data.recommendations[0] || 'Pruefe die Datenschutzerklaerung') +
      '</div>';

    warning.querySelector('.achtung-warning-close').addEventListener('click', () => warning.remove());
    form.insertBefore(warning, form.firstChild);
  }

  async function detectDarkPatternsOnPage() {
    const elements = { buttons: [], checkboxes: [], text: [], modals: [] };

    document.querySelectorAll('button, a.btn, input[type="submit"]').forEach(btn => {
      elements.buttons.push({
        text: btn.textContent || btn.value || '',
        classes: Array.from(btn.classList)
      });
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      elements.checkboxes.push({
        label: getFieldLabel(cb),
        checked: cb.checked,
        visible: isElementVisible(cb)
      });
    });

    document.querySelectorAll('p, span, div').forEach(el => {
      const text = el.textContent || '';
      if (text.match(/nur noch \d+|letzte chance|endet in|andere schauen|schnell/i)) {
        elements.text.push(text.substring(0, 100));
      }
    });

    const result = await sendMessage({
      type: 'DETECT_DARK_PATTERNS',
      payload: {
        pageUrl: window.location.href,
        pageDomain: window.location.hostname,
        elements
      }
    });

    if (result?.data?.darkPatternScore > 30) {
      highlightDarkPatterns(result.data);
    }
  }

  function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }

  function highlightDarkPatterns(data) {
    data.patternsFound.forEach(pattern => {
      if (pattern.type === 'hidden_checkbox') {
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
          if (!isElementVisible(cb)) {
            const wrapper = cb.closest('label') || cb.parentElement;
            if (wrapper) {
              wrapper.style.outline = '2px solid #f44336';
              wrapper.title = 'achtung.live: Versteckte Checkbox!';
            }
          }
        });
      }
    });

    if (data.darkPatternScore > 60) {
      showPageWarning('dark_patterns', {
        score: data.darkPatternScore,
        count: data.patternsFound.length,
        message: 'Diese Seite verwendet manipulative Dark Patterns'
      });
    }
  }

  async function analyzeCookieBanner() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const bannerSelectors = [
      '#cookie-banner', '.cookie-banner', '.cookie-consent',
      '#gdpr', '.gdpr-banner', '[class*="cookie"]', '[id*="cookie"]',
      '[class*="consent"]', '#onetrust-banner-sdk', '.cc-banner'
    ];

    let banner = null;
    for (const selector of bannerSelectors) {
      banner = document.querySelector(selector);
      if (banner && isElementVisible(banner)) break;
    }

    if (!banner) return;

    const consentBanner = {
      found: true,
      hasRejectAll: !!banner.querySelector('[class*="reject"], [class*="decline"], [class*="ablehnen"]'),
      rejectAllVisible: false,
      acceptAllProminent: true
    };

    const result = await sendMessage({
      type: 'ANALYZE_COOKIES',
      payload: {
        pageUrl: window.location.href,
        pageDomain: window.location.hostname,
        consentBanner,
        detectedTrackers: detectTrackersOnPage()
      }
    });

    if (result?.data?.complianceScore < 50) {
      highlightCookieBanner(banner, result.data);
    }
  }

  function detectTrackersOnPage() {
    const trackers = [];
    const scripts = document.querySelectorAll('script[src]');
    const knownTrackers = [
      { pattern: 'google-analytics.com', name: 'Google Analytics', type: 'analytics' },
      { pattern: 'googletagmanager.com', name: 'Google Tag Manager', type: 'analytics' },
      { pattern: 'facebook.net', name: 'Facebook', type: 'marketing' },
      { pattern: 'doubleclick.net', name: 'DoubleClick', type: 'advertising' }
    ];

    scripts.forEach(script => {
      const src = script.src;
      for (const tracker of knownTrackers) {
        if (src.includes(tracker.pattern)) {
          trackers.push({ name: tracker.name, type: tracker.type, domain: tracker.pattern });
          break;
        }
      }
    });
    return trackers;
  }

  function highlightCookieBanner(banner, data) {
    banner.style.outline = '3px solid #ff9800';
    const info = document.createElement('div');
    info.className = 'achtung-cookie-info';
    info.innerHTML = '<span>! achtung.live: ' + data.issues.length + ' Probleme gefunden</span>';
    banner.appendChild(info);
  }

  function showPageWarning(type, data) {
    document.querySelector('.achtung-page-warning')?.remove();
    const warning = document.createElement('div');
    warning.className = 'achtung-page-warning';
    warning.innerHTML = 
      '<div class="achtung-page-warning-content">' +
        '<span class="achtung-page-warning-icon">[!]</span>' +
        '<span class="achtung-page-warning-text">' + data.message + '</span>' +
        '<button class="achtung-page-warning-close">&times;</button>' +
      '</div>';
    warning.querySelector('.achtung-page-warning-close').addEventListener('click', () => warning.remove());
    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 10000);
  }

  async function scanCurrentPage() {
    const results = {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      forms: [],
      darkPatterns: [],
      trackers: detectTrackersOnPage()
    };

    document.querySelectorAll('form').forEach(form => {
      const fields = Array.from(form.elements)
        .filter(el => el.name || el.id)
        .map(el => ({ name: el.name || el.id, type: el.type, label: getFieldLabel(el) }));
      results.forms.push({ action: form.action, fields });
    });

    return results;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
