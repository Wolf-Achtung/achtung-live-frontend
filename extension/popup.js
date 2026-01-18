// achtung.live Guard - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings and stats
  await loadSettings();
  await loadStats();
  await loadCurrentPage();

  // Setup event listeners
  setupEventListeners();
});

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  const settings = response || {};

  document.getElementById('enabledToggle').checked = settings.enabled !== false;
  document.getElementById('liveTypingToggle').checked = settings.liveTypingGuard !== false;
  document.getElementById('formAnalysisToggle').checked = settings.formAnalysis !== false;
  document.getElementById('darkPatternToggle').checked = settings.darkPatternDetection !== false;
  document.getElementById('cookieAnalysisToggle').checked = settings.cookieAnalysis !== false;

  updateStatusIndicator(settings.enabled !== false);
}

async function loadStats() {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

  document.getElementById('statAnalyses').textContent = formatNumber(stats?.totalAnalyses || 0);
  document.getElementById('statWarnings').textContent = formatNumber(stats?.warningsShown || 0);
  document.getElementById('statDarkPatterns').textContent = formatNumber(stats?.darkPatternsDetected || 0);
  document.getElementById('statTrackers').textContent = formatNumber(stats?.trackersBlocked || 0);
}

async function loadCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      document.getElementById('pageDomain').textContent = url.hostname;

      // Get site data
      const siteData = await chrome.runtime.sendMessage({
        type: 'GET_SITE_DATA',
        payload: { domain: url.hostname }
      });

      if (siteData?.trustScore !== undefined) {
        updatePageScore(siteData.trustScore);
      }
    }
  } catch (e) {
    document.getElementById('pageDomain').textContent = 'Unbekannt';
  }
}

function setupEventListeners() {
  // Main toggle
  document.getElementById('enabledToggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await updateSetting('enabled', enabled);
    updateStatusIndicator(enabled);
  });

  // Feature toggles
  document.getElementById('liveTypingToggle').addEventListener('change', (e) => {
    updateSetting('liveTypingGuard', e.target.checked);
  });

  document.getElementById('formAnalysisToggle').addEventListener('change', (e) => {
    updateSetting('formAnalysis', e.target.checked);
  });

  document.getElementById('darkPatternToggle').addEventListener('change', (e) => {
    updateSetting('darkPatternDetection', e.target.checked);
  });

  document.getElementById('cookieAnalysisToggle').addEventListener('change', (e) => {
    updateSetting('cookieAnalysis', e.target.checked);
  });

  // Scan button
  document.getElementById('scanPageBtn').addEventListener('click', scanCurrentPage);

  // Report button
  document.getElementById('reportBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://achtung.live/report' });
  });
}

async function updateSetting(key, value) {
  await chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    payload: { [key]: value }
  });

  // Notify content scripts
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SETTINGS_UPDATED',
      payload: { [key]: value }
    }).catch(() => {});
  }
}

function updateStatusIndicator(enabled) {
  const indicator = document.getElementById('statusIndicator');
  const statusText = indicator.querySelector('.status-text');
  const statusDot = indicator.querySelector('.status-dot');

  if (enabled) {
    statusText.textContent = 'Aktiv';
    statusDot.style.background = '#4caf50';
    indicator.classList.remove('disabled');
  } else {
    statusText.textContent = 'Deaktiviert';
    statusDot.style.background = '#9e9e9e';
    indicator.classList.add('disabled');
  }
}

function updatePageScore(score) {
  const scoreValue = document.getElementById('scoreValue');
  scoreValue.textContent = score + '%';

  if (score >= 70) {
    scoreValue.style.color = '#4caf50';
  } else if (score >= 40) {
    scoreValue.style.color = '#ff9800';
  } else {
    scoreValue.style.color = '#f44336';
  }
}

async function scanCurrentPage() {
  const btn = document.getElementById('scanPageBtn');
  const originalText = btn.querySelector('.action-text').textContent;
  btn.querySelector('.action-text').textContent = 'Scanne...';
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    const results = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
    displayScanResults(results);

  } catch (error) {
    console.error('Scan error:', error);
    displayScanResults({ error: 'Scan fehlgeschlagen' });
  } finally {
    btn.querySelector('.action-text').textContent = originalText;
    btn.disabled = false;
  }
}

function displayScanResults(results) {
  const section = document.getElementById('resultsSection');
  const content = document.getElementById('resultsContent');

  section.style.display = 'block';

  if (results.error) {
    content.innerHTML = '<div class="result-error">' + results.error + '</div>';
    return;
  }

  let html = '';

  // Forms
  if (results.forms?.length > 0) {
    html += '<div class="result-group">';
    html += '<div class="result-title">[F] Formulare: ' + results.forms.length + '</div>';
    results.forms.forEach(form => {
      html += '<div class="result-item">' + (form.fields?.length || 0) + ' Felder</div>';
    });
    html += '</div>';
  }

  // Trackers
  if (results.trackers?.length > 0) {
    html += '<div class="result-group">';
    html += '<div class="result-title">[T] Tracker: ' + results.trackers.length + '</div>';
    results.trackers.forEach(t => {
      html += '<div class="result-item">' + t.name + ' (' + t.type + ')</div>';
    });
    html += '</div>';
  }

  if (!html) {
    html = '<div class="result-empty">Keine besonderen Funde</div>';
  }

  content.innerHTML = html;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
