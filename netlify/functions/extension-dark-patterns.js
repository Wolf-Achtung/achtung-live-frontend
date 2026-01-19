// Netlify Function: Phase 6 - Browser Extension - Dark Patterns Database
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback dark patterns database
const DARK_PATTERNS_DB = {
  patterns: [
    {
      id: 'confirmshaming',
      name: 'Confirmshaming',
      description: 'Beschämende Sprache für Ablehn-Option',
      examples: ['Nein, ich hasse Geld sparen', 'Ich möchte keine Vorteile', 'Nein danke, ich bin nicht interessiert'],
      detection: {
        buttonTextPatterns: ['nein.*hasse', 'kein.*interesse', 'nicht.*möchte', 'verzichte'],
        visualCues: ['text-muted', 'small', 'btn-link', 'secondary', 'text-gray']
      },
      severity: 'medium'
    },
    {
      id: 'hidden_checkbox',
      name: 'Versteckte Checkbox',
      description: 'Vorab aktivierte Checkbox ist versteckt oder schwer zu finden',
      examples: ['Versteckte Newsletter-Anmeldung', 'Unsichtbare Datenweitergabe-Zustimmung'],
      detection: {
        checkVisibility: true,
        checkPreselected: true
      },
      severity: 'critical'
    },
    {
      id: 'preselected_option',
      name: 'Vorausgewählte Option',
      description: 'Optionen sind standardmäßig aktiviert',
      examples: ['Newsletter bereits angekreuzt', 'Versicherung im Warenkorb'],
      detection: {
        checkboxPatterns: ['newsletter', 'werbung', 'marketing', 'partner', 'versicherung', 'garantie'],
        preChecked: true
      },
      severity: 'medium'
    },
    {
      id: 'fake_urgency',
      name: 'Künstliche Dringlichkeit',
      description: 'Gefälschte Countdown-Timer oder zeitliche Begrenzungen',
      examples: ['Angebot endet in 00:14:32', 'Nur noch heute verfügbar'],
      detection: {
        textPatterns: ['nur noch \\d+', 'endet in', 'letzte chance', 'bald vorbei', 'schnell sein'],
        elements: ['countdown', 'timer', 'deadline']
      },
      severity: 'medium'
    },
    {
      id: 'fake_scarcity',
      name: 'Künstliche Knappheit',
      description: 'Gefälschte Verfügbarkeitsanzeigen',
      examples: ['Nur noch 2 Artikel verfügbar!', '23 andere schauen sich dieses Produkt gerade an'],
      detection: {
        textPatterns: ['nur noch \\d+ (artikel|stück|plätze)', '\\d+ andere', 'fast ausverkauft', 'beliebtes produkt'],
        elements: ['stock-warning', 'scarcity', 'viewers']
      },
      severity: 'medium'
    },
    {
      id: 'trick_questions',
      name: 'Trickfragen',
      description: 'Verwirrende doppelte Verneinungen',
      examples: ['Deaktivieren Sie, um keine E-Mails NICHT zu erhalten'],
      detection: {
        textPatterns: ['nicht.*nicht', 'kein.*kein', 'deaktivieren.*erhalten', 'abwählen.*verzichten']
      },
      severity: 'high'
    },
    {
      id: 'sneak_into_basket',
      name: 'Eingeschlichene Produkte',
      description: 'Produkte werden automatisch zum Warenkorb hinzugefügt',
      examples: ['Versicherung automatisch hinzugefügt', 'Garantieverlängerung vorausgewählt'],
      detection: {
        checkboxPatterns: ['versicherung', 'garantie', 'schutz', 'premium'],
        preChecked: true,
        context: 'checkout'
      },
      severity: 'high'
    },
    {
      id: 'roach_motel',
      name: 'Roach Motel',
      description: 'Einfach anzumelden, schwer zu kündigen',
      examples: ['Kündigung nur per Brief', 'Telefonische Kündigung erforderlich'],
      detection: {
        accountPages: true,
        cancellationPatterns: ['brief', 'telefon', 'schriftlich', 'fax', 'einschreiben']
      },
      severity: 'high'
    },
    {
      id: 'privacy_zuckering',
      name: 'Privacy Zuckering',
      description: 'Verwirrende Datenschutzeinstellungen, die zur Datenfreigabe verleiten',
      examples: ['Profil standardmäßig öffentlich', 'Teilen mit "Freunden von Freunden" aktiviert'],
      detection: {
        togglePatterns: ['öffentlich.*standard', 'teilen.*aktiviert', 'sichtbar.*alle'],
        settingsComplexity: 'high'
      },
      severity: 'high'
    },
    {
      id: 'bait_and_switch',
      name: 'Bait and Switch',
      description: 'Beworbenes Produkt ist nicht verfügbar, Alternative wird angeboten',
      examples: ['Produkt nicht verfügbar, aber...', 'Stattdessen empfehlen wir...'],
      detection: {
        textPatterns: ['nicht.*verfügbar.*aber', 'stattdessen', 'alternative', 'ähnliches produkt']
      },
      severity: 'medium'
    }
  ],
  version: '1.0',
  totalPatterns: 10,
  lastUpdated: new Date().toISOString().split('T')[0]
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=86400" // Cache for 24 hours
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/extension/dark-patterns`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using fallback");
    }

    // Return fallback database
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(DARK_PATTERNS_DB)
    };

  } catch (error) {
    console.error("Dark patterns database error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Fehler beim Laden der Datenbank" }) };
  }
};
