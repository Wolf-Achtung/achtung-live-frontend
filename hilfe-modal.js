document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".hilfe-button");

  buttons.forEach((btn) => {
    const topic = btn.getAttribute("data-modal");

    btn.addEventListener("click", () => openModal(topic));

    // Mouseover = Öffnen, Mouseout = Schließen (nach Timeout)
    btn.addEventListener("mouseenter", () => {
      openModal(topic, true); // true = hoverMode
    });
  });
});

let modalTimer = null;

function openModal(topic, hoverMode = false) {
  closeAllModals();

  const modal = document.createElement("div");
  modal.classList.add("modal");

  modal.innerHTML = `
    <h3>${getModalTitle(topic)}</h3>
    <p>${getModalContent(topic)}</p>
    <button class="modal-close">Schließen</button>
  `;

  document.body.appendChild(modal);
  modal.style.display = "block";

  modal.querySelector(".modal-close").addEventListener("click", () => {
    modal.remove();
    clearTimeout(modalTimer);
  });

  if (hoverMode) {
    modalTimer = setTimeout(() => modal.remove(), 4500);
  }
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach((m) => m.remove());
}

function getModalTitle(topic) {
  const titles = {
    iban: "IBAN sichern",
    kreditkarte: "Kreditkartendaten schützen",
    passwort: "Passwort sicher gestalten",
    medizinisch: "Medizinische Infos schützen",
    kind: "Kinder schützen",
    standort: "Standortdaten sichern",
    urlaub: "Urlaubsinfos schützen",
    screenshot: "Screenshots sicher nutzen",
    whatsapp: "WhatsApp sicher nutzen",
    privat: "Private Aussagen schützen",
    emotional: "Emotionale Aussagen sichern",
    nachricht: "Nachricht sicher verschicken"
  };
  return titles[topic] || "Hilfe";
}

function getModalContent(topic) {
  const content = {
    iban: "Gib deine IBAN nur in vertrauensvollen Kontexten weiter – am besten verschlüsselt.",
    kreditkarte: "Teile deine Kreditkartennummer nie unverschlüsselt.",
    passwort: "Verwende starke Passwörter und teile sie nie direkt.",
    medizinisch: "Medizinische Angaben sollten niemals öffentlich geteilt werden.",
    kind: "Infos über Kinder gehören nicht in öffentliche Texte.",
    standort: "Vermeide die Nennung deines aktuellen Standorts.",
    urlaub: "Vermeide Urlaubspläne öffentlich zu machen – Einbruchsgefahr.",
    screenshot: "Screenshots können vertrauliche Infos enthalten.",
    whatsapp: "Nutze Verschlüsselung und Schutzfunktionen bei WhatsApp.",
    privat: "Persönliche Aussagen lassen sich datenschonend umformulieren.",
    emotional: "Wähle Worte mit Bedacht bei sensiblen Inhalten.",
    nachricht: "Sende Nachrichten über verschlüsselte Kanäle."
  };
  return content[topic] || "Kein Hilfetext vorhanden.";
}
