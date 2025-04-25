// hilfe-modal.js

async function loadHilfeModals() {
  const container = document.getElementById("hilfe-container");
  if (!container) return;

  try {
    const res = await fetch("hilfe_config.json");
    const data = await res.json();

    data.hilfe.forEach(entry => {
      // Button
      const button = document.createElement("button");
      button.textContent = entry.button;
      button.className = "hilfe-button";
      button.onclick = () => openModal(entry.id);
      container.appendChild(button);

      // Modal
      const modal = document.createElement("div");
      modal.id = `modal-${entry.id}`;
      modal.className = "hilfe-modal";
      modal.innerHTML = `
        <div class="hilfe-modal-content">
          <span class="hilfe-close" onclick="closeModal('${entry.id}')">&times;</span>
          <h2>${entry.title}</h2>
          <p>${entry.text.replace(/\n/g, "<br>")}</p>
        </div>
      `;
      document.body.appendChild(modal);
    });
  } catch (err) {
    console.error("hilfe_config.json konnte nicht geladen werden", err);
  }
}

function openModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.style.display = "block";
}

function closeModal(id) {
  const modal = document.getElementById(`modal-${id}`);
  if (modal) modal.style.display = "none";
}

// Klick außerhalb des Modals schließt es
window.onclick = function (event) {
  document.querySelectorAll(".hilfe-modal").forEach(modal => {
    if (event.target === modal) modal.style.display = "none";
  });
};

// Lade Modals nach DOM-Start
document.addEventListener("DOMContentLoaded", loadHilfeModals);
