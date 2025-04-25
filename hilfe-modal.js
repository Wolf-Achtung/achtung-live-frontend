document.addEventListener("DOMContentLoaded", function () {
  const hilfeContainer = document.getElementById("hilfe-container");

  fetch("hilfe_config.json")
    .then(response => response.json())
    .then(data => {
      data.hilfe.forEach(item => {
        // Erstelle den Button für jedes Hilfethema
        const button = document.createElement("button");
        button.className = "hilfe-button";
        button.innerText = item.button;
        button.onclick = () => openModal(item.title, item.text);
        hilfeContainer.appendChild(button);
      });
    })
    .catch(error => console.error("Fehler beim Laden der Hilfe-Config:", error));

  function openModal(title, text) {
    // Erstelle das Modal-Overlay
    const modal = document.createElement("div");
    modal.className = "hilfe-modal";
    modal.innerHTML = `
      <div class="hilfe-modal-content">
        <span class="hilfe-close">&times;</span>
        <h2>${title}</h2>
        <p>${text}</p>
      </div>
    `;
    document.body.appendChild(modal);

    // Anzeigen
    modal.style.display = "block";

    // Schließen beim Klick auf das Schließen-Symbol oder außerhalb
    modal.querySelector(".hilfe-close").onclick = () => closeModal(modal);
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    };
  }

  function closeModal(modal) {
    modal.style.display = "none";
    document.body.removeChild(modal);
  }
});
