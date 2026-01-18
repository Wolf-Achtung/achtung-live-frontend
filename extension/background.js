// achtung.live Privacy Guard - Background Service Worker

const API_URL = 'https://achtung-live-frontend.netlify.app/.netlify/functions/analyze';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for selected text
  chrome.contextMenus.create({
    id: 'achtung-check-selection',
    title: 'Mit achtung.live prüfen',
    contexts: ['selection']
  });

  // Initialize default settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({
        settings: {
          autoCheck: false,
          showBadge: true
        }
      });
    }
  });

  // Set initial badge
  chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
  chrome.action.setBadgeText({ text: '' });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'achtung-check-selection') {
    const selectedText = info.selectionText;

    if (!selectedText || selectedText.length < 5) {
      return;
    }

    try {
      // Perform check
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, context: 'private' })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Send result to content script
      chrome.tabs.sendMessage(tab.id, {
        type: 'ACHTUNG_CHECK_RESULT',
        data: data,
        text: selectedText
      });

      // Update badge
      updateBadge(data);

    } catch (error) {
      console.error('achtung.live check error:', error);
    }
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_TEXT') {
    checkText(message.text)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'UPDATE_BADGE') {
    updateBadge(message.data);
  }
});

// Check text via API
async function checkText(text) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context: 'private' })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Update extension badge
function updateBadge(data) {
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings?.showBadge) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const categories = data.categories || [];

    if (categories.length === 0) {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    } else {
      chrome.action.setBadgeText({ text: String(categories.length) });
      const riskScore = data.riskScore ?? 100;
      const color = riskScore >= 80 ? '#ffc107' : riskScore >= 50 ? '#fd7e14' : '#dc3545';
      chrome.action.setBadgeBackgroundColor({ color });
    }
  });
}
