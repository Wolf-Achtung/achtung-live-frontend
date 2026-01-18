// achtung.live Privacy Guard - Content Script
// Runs on all web pages to provide inline privacy checking

const API_URL = 'https://achtung-live-frontend.netlify.app/.netlify/functions/analyze';

// Track monitored elements
let monitoredElements = new WeakSet();
let checkTimeout = null;

// Initialize content script
function init() {
  // Listen for settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (result.settings?.autoCheck) {
      setupAutoCheck();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings?.newValue?.autoCheck) {
      setupAutoCheck();
    }
  });

  // Setup right-click context menu handler
  document.addEventListener('contextmenu', handleContextMenu);
}

// Setup auto-check for text inputs
function setupAutoCheck() {
  // Find all text inputs and textareas
  const inputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');

  inputs.forEach(input => {
    if (monitoredElements.has(input)) return;
    monitoredElements.add(input);

    input.addEventListener('input', debounce(handleInputChange, 1500));
    input.addEventListener('blur', handleInputBlur);
  });

  // Watch for dynamically added inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const inputs = node.querySelectorAll?.('textarea, input[type="text"], [contenteditable="true"]') || [];
          inputs.forEach(input => {
            if (!monitoredElements.has(input)) {
              monitoredElements.add(input);
              input.addEventListener('input', debounce(handleInputChange, 1500));
              input.addEventListener('blur', handleInputBlur);
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Handle input changes for auto-check
async function handleInputChange(event) {
  const element = event.target;
  const text = getElementText(element);

  if (text.length < 20) {
    hideWarning(element);
    return;
  }

  try {
    const result = await checkText(text);

    if (result.categories && result.categories.length > 0) {
      showWarning(element, result);
    } else {
      hideWarning(element);
    }
  } catch (error) {
    console.error('achtung.live check error:', error);
  }
}

// Handle input blur (when leaving field)
function handleInputBlur(event) {
  const element = event.target;
  // Keep warning visible for a moment after blur
  setTimeout(() => {
    if (document.activeElement !== element) {
      hideWarning(element);
    }
  }, 2000);
}

// Get text from element
function getElementText(element) {
  if (element.isContentEditable) {
    return element.innerText || element.textContent || '';
  }
  return element.value || '';
}

// Check text via API
async function checkText(text) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context: 'private', options: { quickCheck: true } })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Show warning indicator near element
function showWarning(element, result) {
  // Remove existing warning
  hideWarning(element);

  const categories = result.categories || [];
  const riskCount = categories.length;
  const riskScore = result.riskScore ?? 100;

  // Create warning element
  const warning = document.createElement('div');
  warning.className = 'achtung-live-warning';
  warning.setAttribute('data-achtung-warning', 'true');

  const level = riskScore >= 80 ? 'low' : riskScore >= 50 ? 'medium' : 'high';
  warning.classList.add(`achtung-${level}`);

  warning.innerHTML = `
    <div class="achtung-warning-content">
      <span class="achtung-icon">⚠️</span>
      <span class="achtung-text">${riskCount} ${riskCount === 1 ? 'Risiko' : 'Risiken'} erkannt</span>
      <button class="achtung-details-btn" title="Details anzeigen">ℹ️</button>
      <button class="achtung-close-btn" title="Schließen">&times;</button>
    </div>
    <div class="achtung-details" style="display: none;">
      ${categories.slice(0, 3).map(cat => `
        <div class="achtung-risk-item">
          <span class="achtung-risk-type">${cat.type || 'Sensibel'}</span>
          ${cat.message ? `<span class="achtung-risk-msg">${cat.message.substring(0, 100)}</span>` : ''}
        </div>
      `).join('')}
      ${riskCount > 3 ? `<div class="achtung-more">+${riskCount - 3} weitere Risiken</div>` : ''}
      <a href="https://achtung.live/demo.html" target="_blank" class="achtung-full-check">Vollständige Prüfung</a>
    </div>
  `;

  // Position near the element
  const rect = element.getBoundingClientRect();
  warning.style.position = 'fixed';
  warning.style.top = `${rect.bottom + 5}px`;
  warning.style.left = `${rect.left}px`;
  warning.style.zIndex = '999999';

  document.body.appendChild(warning);

  // Event handlers
  warning.querySelector('.achtung-close-btn').addEventListener('click', () => {
    hideWarning(element);
  });

  warning.querySelector('.achtung-details-btn').addEventListener('click', () => {
    const details = warning.querySelector('.achtung-details');
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  });

  // Store reference
  element.achtungWarning = warning;
}

// Hide warning for element
function hideWarning(element) {
  if (element.achtungWarning) {
    element.achtungWarning.remove();
    element.achtungWarning = null;
  }
}

// Handle context menu (right-click)
function handleContextMenu(event) {
  const selection = window.getSelection().toString().trim();

  if (selection.length > 0) {
    // Store selected text for background script
    chrome.storage.local.set({ selectedText: selection });
  }
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
