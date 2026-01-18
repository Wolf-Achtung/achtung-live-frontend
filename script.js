/**
 * achtung.live - Main Script
 * Handles text analysis, rewrite suggestions, and howto functionality
 */

// API Configuration - einheitlicher Endpunkt
const API_BASE_URL = "https://web-production-2e4ae.up.railway.app";

// DOM Elements
const analyzeButton = document.getElementById("analyze-button");
const inputText = document.getElementById("input-text");
const resultBox = document.getElementById("results");
const rewriteButton = document.getElementById("rewrite-button");
const rewritePopup = document.getElementById("rewrite-popup");
const empathyBox = document.getElementById("empathy-message");
const howtoButton = document.getElementById("howto-button");
const howtoBox = document.getElementById("howto-box");

/**
 * Sichere Fetch-Funktion mit Error-Handling
 */
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API-Fehler:", error);
    throw error;
  }
}

/**
 * Zeigt eine Fehlermeldung im angegebenen Element an
 */
function showError(element, message) {
  if (element) {
    element.innerHTML = `<div style="color: #800000; padding: 10px; border: 1px solid #800000; border-radius: 5px;">
      <strong>Fehler:</strong> ${message}
    </div>`;
  }
}

// Event Listener nur hinzufügen wenn Elemente existieren
if (analyzeButton && inputText && resultBox) {
  analyzeButton.addEventListener("click", async () => {
    const text = inputText.value;
    const consentCheckbox = document.getElementById("consent");
    const consent = consentCheckbox ? consentCheckbox.checked : true;

    if (!text) {
      alert("Bitte gib einen Text ein.");
      return;
    }

    if (consentCheckbox && !consent) {
      alert("Bitte stimme der Analyse zu.");
      return;
    }

    resultBox.innerHTML = '<em>Analyse läuft…</em>';

    if (empathyBox) empathyBox.classList.add("hidden");
    if (rewriteButton) rewriteButton.classList.add("hidden");
    if (howtoButton) howtoButton.classList.add("hidden");

    try {
      const data = await safeFetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      resultBox.innerHTML = `
        <strong>Erkannte Datenarten:</strong> ${data.detected_data || "Keine"}<br />
        <strong>Datenschutz-Risiko:</strong> ${data.risk_level || "Unbekannt"}<br />
        <strong>achtung.live-Empfehlung:</strong> ${data.explanation || "Keine Empfehlung"}<br />
        <strong>Tipp:</strong> ${data.tip || "Kein Tipp verfügbar"}<br />
        ${data.source ? `<strong>Quelle:</strong> <a href="${data.source}" target="_blank" rel="noopener">${data.source}</a>` : ""}
      `;

      if (data.empathy_message && empathyBox) {
        empathyBox.className = `empathy-box ${data.empathy_level || ""}`;
        empathyBox.innerText = data.empathy_message;
        empathyBox.classList.remove("hidden");
      }

      if (data.rewrite_offer) {
        if (rewriteButton) rewriteButton.classList.remove("hidden");
        if (howtoButton) howtoButton.classList.remove("hidden");
      }
    } catch (error) {
      showError(resultBox, "Die Analyse konnte nicht durchgeführt werden. Bitte versuche es später erneut.");
    }
  });
}

if (rewriteButton && rewritePopup && inputText) {
  rewriteButton.addEventListener("click", async () => {
    const text = inputText.value;
    rewritePopup.innerText = "Vorschlag wird erstellt…";
    rewritePopup.classList.remove("hidden");

    try {
      const data = await safeFetch(`${API_BASE_URL}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      rewritePopup.innerText = "Vorschlag für sicheren Text:\n\n" + (data.rewritten || "Kein Vorschlag verfügbar");
    } catch (error) {
      rewritePopup.innerText = "Fehler: Der Vorschlag konnte nicht erstellt werden.";
    }
  });
}

if (howtoButton && howtoBox) {
  howtoButton.addEventListener("click", async () => {
    howtoBox.classList.remove("hidden");
    howtoBox.innerText = "Anleitung wird geladen…";

    try {
      const data = await safeFetch(`${API_BASE_URL}/howto`);
      howtoBox.innerText = data.howto || "Keine Anleitung verfügbar";
    } catch (error) {
      howtoBox.innerText = "Fehler: Die Anleitung konnte nicht geladen werden.";
    }
  });
}
