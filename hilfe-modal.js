// hilfe-modal.js – Achtung.live Modal System

// Text-Inhalte der einzelnen Hilfethemen
const hilfeTexte = {
  iban: `
    <h2>Bankdaten schützen</h2>
    <p>Deine IBAN gehört zu deinen sensibelsten Informationen. Teile sie niemals öffentlich oder unverschlüsselt.</p>
    <ul>
      <li>Keine IBAN in öffentlichen Posts oder Chats.</li>
      <li>Verwende verschlüsselte Kanäle für Bankdaten.</li>
      <li>Frage dich immer: Muss ich diese Daten wirklich teilen?</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Deine Nachricht wird bei achtung.live nicht gespeichert. Deine Privatsphäre zählt.</p>
  `,
  kreditkarte: `
    <h2>Kreditkartendaten sichern</h2>
    <p>Kreditkartendaten sind besonders anfällig für Betrug. Halte sie offline und geschützt.</p>
    <ul>
      <li>Keine Kartennummern in Chats senden.</li>
      <li>Nur vertrauenswürdige Dienste nutzen.</li>
      <li>Regelmäßig Kontoauszüge prüfen.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> achtsam teilen schützt dein Konto.</p>
  `,
  gesundheit: `
    <h2>Gesundheitsdaten bewahren</h2>
    <p>Deine Gesundheitsdaten sind sehr privat. Sei vorsichtig mit dem, was du teilst.</p>
    <ul>
      <li>Keine Diagnosen oder Medikamentenpläne öffentlich posten.</li>
      <li>Private Chats bevorzugen, nicht öffentliche Foren.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Achtung.live hilft dir dabei, sensible Inhalte zu erkennen.</p>
  `,
  privat: `
    <h2>Privates mit Kollegen und Freunden</h2>
    <p>Berufliche und private Informationen sollten nicht vermischt werden.</p>
    <ul>
      <li>Keine internen Details aus der Firma posten.</li>
      <li>Rücksprache bei Fotos von Events oder Feiern.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Erst denken, dann senden!</p>
  `,
  standort: `
    <h2>Standort-Infos absichern</h2>
    <p>Dein aktueller Aufenthaltsort sollte nicht jederzeit einsehbar sein.</p>
    <ul>
      <li>Live-Standort nur in privaten Chats teilen.</li>
      <li>Verzögertes Posten von Urlaubsfotos hilft!</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Vermeide Echtzeit-Ortung durch Social Media.</p>
  `,
  urlaub: `
    <h2>Urlaub clever teilen</h2>
    <p>Teile Urlaubserlebnisse erst nach der Rückkehr – nicht in Echtzeit!</p>
    <ul>
      <li>Keine Live-Stories während Reisen posten.</li>
      <li>Vermeide "Weg"-Hinweise im Netz.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Dein Zuhause bleibt sicherer, wenn niemand weiß, dass es leer ist.</p>
  `,
  whatsapp: `
    <h2>WhatsApp sicher nutzen</h2>
    <p>WhatsApp ist bequem, aber nicht perfekt sicher.</p>
    <ul>
      <li>Keine vertraulichen Daten über Gruppen senden.</li>
      <li>Bei sensiblen Themen auf Alternativen wie Signal setzen.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Nutze Messenger mit Ende-zu-Ende-Verschlüsselung.</p>
  `,
  screenshot: `
    <h2>Screenshots bewusst teilen</h2>
    <p>Screenshots enthalten oft versteckte sensible Infos.</p>
    <ul>
      <li>Kontaktiere uns vor dem Teilen sensibler Screenshots.</li>
      <li>Vermeide sichtbare Passwörter oder Chatnamen.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Immer prüfen, was im Bild zu sehen ist!</p>
  `,
  kind: `
    <h2>Kinderdaten schützen</h2>
    <p>Fotos oder Daten von Kindern sollten mit höchster Vorsicht behandelt werden.</p>
    <ul>
      <li>Gesichter unkenntlich machen oder anonymisieren.</li>
      <li>Keine Echtzeit-Fotos vom Schulweg posten.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Achtung.live hilft dir, Risiken früh zu erkennen.</p>
  `,
  passwort: `
    <h2>Passwort-Tipps</h2>
    <p>Starke Passwörter sind der erste Schutz deiner digitalen Identität.</p>
    <ul>
      <li>Verwende komplexe Passphrasen.</li>
      <li>Für jede Plattform ein eigenes Passwort.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Passwortmanager helfen dir, alles sicher im Blick zu behalten.</p>
  `,
  nachricht: `
    <h2>Nachrichten sicher versenden</h2>
    <p>Auch private Nachrichten können abgefangen werden. Verschlüssele sie!</p>
    <ul>
      <li>Nur verschlüsselte Messenger nutzen.</li>
      <li>Keine sensiblen Infos über offene Kanäle senden.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Vertrauliches bleibt vertraulich – mit Achtung.live im Ohr.</p>
  `,
  chef: `
    <h2>Firmen-Interna schützen</h2>
    <p>Arbeitsplatzbezogene Infos gehören nicht ins Netz.</p>
    <ul>
      <li>Keine öffentlichen Beschwerden oder Firmengeheimnisse posten.</li>
      <li>Feedback intern und sachlich formulieren.</li>
    </ul>
    <p class="note">🔒 <strong>Tipp:</strong> Schütze deine Reputation – und die deines Arbeitgebers.</p>
  `
};

// Öffnet das Modal mit dem passenden Text
function openModal(thema) {
  const modal = document.getElementById("hilfeModal");
  const modalText = document.getElementById("modalText");
  modalText.innerHTML = hilfeTexte[thema] || "<p>Keine Details verfügbar.</p>";
  modal.classList.add("show");
}

// Schließt das Modal
function closeModal() {
  const modal = document.getElementById("hilfeModal");
  modal.classList.remove("show");
}
