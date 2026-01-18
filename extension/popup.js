// achtung.live Privacy Guard - Popup Script

const API_URL = 'https://achtung-live-frontend.netlify.app/.netlify/functions/analyze';

// Category metadata for display
const CATEGORY_META = {
  iban: { label: "Bankdaten", icon: "🏦" },
  credit_card: { label: "Kreditkarte", icon: "💳" },
  phone: { label: "Telefon", icon: "📱" },
  email: { label: "E-Mail", icon: "📧" },
  address: { label: "Adresse", icon: "📍" },
  name: { label: "Name", icon: "👤" },
  health: { label: "Gesundheit", icon: "🏥" },
  password: { label: "Passwort", icon: "🔑" },
  location: { label: "Standort", icon: "📍" },
  vacation: { label: "Abwesenheit", icon: "✈️" },
  child: { label: "Kinderdaten", icon: "👶" },
  generic: { label: "Sensibel", icon: "⚠️" }
};

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  loadSettings();
});

function initializeUI() {
  const textArea = document.getElementById('quickText');
  const checkBtn = document.getElementById('checkBtn');
  const closeResults = document.getElementById('closeResults');
  const charCount = document.getElementById('charCount');

  // Character counter
  textArea.addEventListener('input', () => {
    charCount.textContent = textArea.value.length;

    // Auto-check if enabled
    const autoCheck = document.getElementById('autoCheck').checked;
    if (autoCheck && textArea.value.length > 20) {
      debounce(performCheck, 1000)();
    }
  });

  // Check button
  checkBtn.addEventListener('click', performCheck);

  // Close results
  closeResults.addEventListener('click', () => {
    document.getElementById('resultsSection').style.display = 'none';
  });

  // Settings toggles
  document.getElementById('autoCheck').addEventListener('change', saveSettings);
  document.getElementById('showBadge').addEventListener('change', saveSettings);

  // Paste from clipboard shortcut
  textArea.addEventListener('paste', () => {
    setTimeout(() => {
      charCount.textContent = textArea.value.length;
    }, 10);
  });
}

// Debounce helper
let debounceTimer;
function debounce(func, wait) {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), wait);
  };
}

// Perform privacy check
async function performCheck() {
  const text = document.getElementById('quickText').value.trim();

  if (!text) {
    showError('Bitte Text eingeben');
    return;
  }

  if (text.length < 5) {
    showError('Text zu kurz (min. 5 Zeichen)');
    return;
  }

  // Show loading state
  setLoadingState(true);
  updateStatus('checking', 'Prüfe...');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context: 'private' })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    displayResults(data, text);
    updateBadge(data);

  } catch (error) {
    console.error('Check error:', error);
    showError('Verbindungsfehler. Bitte erneut versuchen.');
    updateStatus('error', 'Offline');
  } finally {
    setLoadingState(false);
  }
}

// Display results
function displayResults(data, originalText) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');

  // Normalize data
  const riskScore = data.riskScore ?? 100;
  const categories = data.categories || [];

  if (categories.length === 0) {
    // All safe
    resultsContent.innerHTML = `
      <div class="result-safe">
        <div class="result-icon">🛡️</div>
        <div class="result-title">Alles sicher!</div>
        <div class="result-text">Keine sensiblen Daten erkannt.</div>
      </div>
    `;
    updateStatus('safe', 'Sicher');
  } else {
    // Risks found
    const level = riskScore >= 80 ? 'low' : riskScore >= 50 ? 'medium' : 'high';

    resultsContent.innerHTML = `
      <div class="result-warning ${level}">
        <div class="result-score">
          <span class="score-number">${riskScore}</span>
          <span class="score-label">/ 100</span>
        </div>
        <div class="result-risks">
          ${categories.slice(0, 5).map(cat => {
            const meta = CATEGORY_META[cat.type] || CATEGORY_META.generic;
            return `
              <div class="risk-item ${cat.severity || 'medium'}">
                <span class="risk-icon">${meta.icon}</span>
                <span class="risk-label">${meta.label}</span>
              </div>
            `;
          }).join('')}
          ${categories.length > 5 ? `<div class="risk-more">+${categories.length - 5} weitere</div>` : ''}
        </div>
        <div class="result-hint">
          ${categories.length} ${categories.length === 1 ? 'Risiko' : 'Risiken'} erkannt
        </div>
      </div>
      <a href="https://achtung.live/demo.html" target="_blank" class="full-analysis-btn">
        Vollständige Analyse öffnen
      </a>
    `;
    updateStatus(level === 'high' ? 'danger' : 'warning', `${categories.length} Risiken`);
  }

  resultsSection.style.display = 'block';
}

// Show error message
function showError(message) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');

  resultsContent.innerHTML = `
    <div class="result-error">
      <span class="error-icon">⚠️</span>
      <span class="error-text">${message}</span>
    </div>
  `;

  resultsSection.style.display = 'block';
}

// Update status indicator
function updateStatus(status, text) {
  const indicator = document.getElementById('statusIndicator');
  indicator.className = 'status-indicator ' + status;
  indicator.querySelector('.status-text').textContent = text;
}

// Set loading state
function setLoadingState(loading) {
  const btn = document.getElementById('checkBtn');
  const btnIcon = btn.querySelector('.btn-icon');
  const btnText = btn.querySelector('.btn-text');

  if (loading) {
    btn.disabled = true;
    btnIcon.textContent = '⏳';
    btnText.textContent = 'Prüfe...';
  } else {
    btn.disabled = false;
    btnIcon.textContent = '🔍';
    btnText.textContent = 'Text prüfen';
  }
}

// Update extension badge
function updateBadge(data) {
  const showBadge = document.getElementById('showBadge').checked;

  if (!showBadge) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const categories = data.categories || [];

  if (categories.length === 0) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
  } else {
    chrome.action.setBadgeText({ text: String(categories.length) });
    const riskScore = data.riskScore ?? 100;
    const color = riskScore >= 80 ? '#ffc107' : riskScore >= 50 ? '#fd7e14' : '#dc3545';
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

// Save settings to storage
function saveSettings() {
  const settings = {
    autoCheck: document.getElementById('autoCheck').checked,
    showBadge: document.getElementById('showBadge').checked
  };

  chrome.storage.sync.set({ settings });
}

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['settings'], (result) => {
    if (result.settings) {
      document.getElementById('autoCheck').checked = result.settings.autoCheck || false;
      document.getElementById('showBadge').checked = result.settings.showBadge !== false;
    }
  });
}
