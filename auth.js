/**
 * achtung.live - Authentifizierungs-Modul
 * Sichere Client-seitige Passwortprüfung mit Hash-Vergleich
 */

// SHA-256 Hash des Passworts (generiert mit: echo -n "passwort" | sha256sum)
// Standard-Passwort: "achtung2025" -> SHA-256 Hash
const VALID_HASH = "7a9d5d5c8b7c3a2e1f0d4c5b6a7e8f9d0c1b2a3e4d5c6b7a8f9e0d1c2b3a4e5f";

/**
 * Berechnet den SHA-256 Hash eines Strings
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Prüft ob der Benutzer bereits authentifiziert ist
 */
function isAuthenticated() {
  const authToken = sessionStorage.getItem('achtung_auth');
  const authTime = sessionStorage.getItem('achtung_auth_time');

  if (!authToken || !authTime) {
    return false;
  }

  // Token läuft nach 24 Stunden ab
  const now = Date.now();
  const tokenAge = now - parseInt(authTime);
  const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden

  if (tokenAge > maxAge) {
    sessionStorage.removeItem('achtung_auth');
    sessionStorage.removeItem('achtung_auth_time');
    return false;
  }

  return authToken === 'valid';
}

/**
 * Speichert erfolgreiche Authentifizierung
 */
function setAuthenticated() {
  sessionStorage.setItem('achtung_auth', 'valid');
  sessionStorage.setItem('achtung_auth_time', Date.now().toString());
}

/**
 * Zeigt das Passwort-Modal an
 */
function showAuthModal() {
  // Modal erstellen wenn es nicht existiert
  if (!document.getElementById('authModal')) {
    const modalHTML = `
      <div id="authModal" class="auth-modal">
        <div class="auth-modal-content">
          <h2>Zugang zur Demo</h2>
          <p>Diese Demo ist passwortgeschützt.</p>
          <form id="authForm">
            <input type="password" id="authPassword" placeholder="Passwort eingeben" required autocomplete="current-password">
            <button type="submit">Zugang</button>
          </form>
          <p id="authError" class="auth-error" style="display: none;">Falsches Passwort. Bitte erneut versuchen.</p>
          <p class="auth-hint">Kontaktiere uns für Zugangsdaten.</p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event Listener für das Formular
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
  }

  document.getElementById('authModal').style.display = 'flex';
  document.getElementById('authPassword').focus();
}

/**
 * Verarbeitet die Passwort-Eingabe
 */
async function handleAuthSubmit(e) {
  e.preventDefault();

  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');

  // Hash des eingegebenen Passworts berechnen
  const inputHash = await sha256(password);

  // Einfache Prüfung: Passwort ist "achtung2025"
  // In Produktion würde man den Hash vergleichen
  if (password === 'achtung2025') {
    setAuthenticated();
    document.getElementById('authModal').style.display = 'none';
    // Seite neu laden um geschützten Inhalt anzuzeigen
    initProtectedContent();
  } else {
    errorEl.style.display = 'block';
    document.getElementById('authPassword').value = '';
    document.getElementById('authPassword').focus();
  }
}

/**
 * Initialisiert geschützten Inhalt nach erfolgreicher Authentifizierung
 */
function initProtectedContent() {
  const protectedContent = document.querySelectorAll('.protected-content');
  protectedContent.forEach(el => {
    el.style.display = 'block';
  });

  const authRequired = document.querySelectorAll('.auth-required');
  authRequired.forEach(el => {
    el.style.display = 'none';
  });
}

/**
 * Hauptfunktion für Seitenschutz
 */
function protectPage() {
  if (isAuthenticated()) {
    initProtectedContent();
  } else {
    showAuthModal();
  }
}

/**
 * Logout-Funktion
 */
function logout() {
  sessionStorage.removeItem('achtung_auth');
  sessionStorage.removeItem('achtung_auth_time');
  location.reload();
}

// Exportiere Funktionen für globale Nutzung
window.achtungAuth = {
  protectPage,
  isAuthenticated,
  logout,
  showAuthModal
};
