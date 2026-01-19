// Netlify Function: Phase 11 - Privacy Templates - GDPR Request Templates
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback GDPR templates
const GDPR_TEMPLATES = {
  access: {
    requestType: "access",
    name: "Auskunftsanfrage",
    icon: "📋",
    legalBasis: "Art. 15 DSGVO - Auskunftsrecht",
    responseDeadline: "30 Tage",
    subject: "Auskunftsanfrage gemäß Art. 15 DSGVO",
    body: `Sehr geehrte Damen und Herren,

hiermit mache ich von meinem Auskunftsrecht gemäß Art. 15 DSGVO Gebrauch und bitte Sie, mir folgende Informationen mitzuteilen:

1. Ob Sie personenbezogene Daten von mir verarbeiten
2. Falls ja, welche Kategorien von Daten betroffen sind
3. Die Verarbeitungszwecke
4. Die Empfänger oder Kategorien von Empfängern
5. Die geplante Speicherdauer
6. Das Bestehen von Betroffenenrechten (Berichtigung, Löschung, Einschränkung, Widerspruch)
7. Das Beschwerderecht bei einer Aufsichtsbehörde
8. Die Herkunft der Daten (falls nicht bei mir erhoben)
9. Das Bestehen einer automatisierten Entscheidungsfindung

Bitte stellen Sie mir eine Kopie der personenbezogenen Daten, die Gegenstand der Verarbeitung sind, zur Verfügung.

Zur Identifikation: {{IDENTIFIKATION}}

Bitte antworten Sie innerhalb der gesetzlichen Frist von einem Monat.

Mit freundlichen Grüßen
{{NAME}}`,
    placeholders: [
      { key: "{{NAME}}", description: "Dein vollständiger Name", required: true },
      { key: "{{IDENTIFIKATION}}", description: "Z.B. Kundennummer, E-Mail-Adresse oder andere Identifikationsmerkmale", required: true }
    ],
    tips: [
      "Sende die Anfrage per E-Mail UND Einschreiben für einen Nachweis",
      "Notiere dir das Sendedatum für die Fristberechnung",
      "Unternehmen müssen innerhalb von 30 Tagen antworten",
      "Bei komplexen Anfragen kann die Frist um 2 Monate verlängert werden"
    ]
  },
  deletion: {
    requestType: "deletion",
    name: "Löschungsanfrage",
    icon: "🗑️",
    legalBasis: "Art. 17 DSGVO - Recht auf Löschung",
    responseDeadline: "30 Tage",
    subject: "Antrag auf Löschung personenbezogener Daten (Art. 17 DSGVO)",
    body: `Sehr geehrte Damen und Herren,

hiermit mache ich von meinem Recht auf Löschung gemäß Art. 17 DSGVO Gebrauch.

Ich fordere Sie auf, sämtliche über mich gespeicherten personenbezogenen Daten unverzüglich zu löschen.

Betroffen sind insbesondere:
{{DATENARTEN}}

Der Löschungsanspruch besteht, da:
☐ Die Daten für die Zwecke, für die sie erhoben wurden, nicht mehr notwendig sind
☐ Ich meine Einwilligung widerrufe und es keine andere Rechtsgrundlage gibt
☐ Ich der Verarbeitung widerspreche und keine vorrangigen berechtigten Gründe vorliegen
☐ Die Daten unrechtmäßig verarbeitet wurden

Zur Identifikation: {{IDENTIFIKATION}}

Bitte bestätigen Sie mir die vollständige Löschung schriftlich innerhalb der gesetzlichen Frist von einem Monat.

Mit freundlichen Grüßen
{{NAME}}`,
    placeholders: [
      { key: "{{NAME}}", description: "Dein vollständiger Name", required: true },
      { key: "{{DATENARTEN}}", description: "Welche Daten gelöscht werden sollen (z.B. Kundenkonto, E-Mail-Adresse, Bestellhistorie)", required: true },
      { key: "{{IDENTIFIKATION}}", description: "Z.B. Kundennummer, E-Mail-Adresse", required: true }
    ],
    tips: [
      "Wähle mindestens einen Löschungsgrund aus",
      "Sei so spezifisch wie möglich bei den Datenarten",
      "Fordere eine schriftliche Bestätigung der Löschung",
      "Manche Daten müssen aus gesetzlichen Gründen aufbewahrt werden (z.B. Rechnungen)"
    ]
  },
  rectification: {
    requestType: "rectification",
    name: "Berichtigungsanfrage",
    icon: "✏️",
    legalBasis: "Art. 16 DSGVO - Recht auf Berichtigung",
    responseDeadline: "30 Tage",
    subject: "Antrag auf Berichtigung personenbezogener Daten (Art. 16 DSGVO)",
    body: `Sehr geehrte Damen und Herren,

hiermit mache ich von meinem Recht auf Berichtigung gemäß Art. 16 DSGVO Gebrauch.

Ich habe festgestellt, dass folgende über mich gespeicherte Daten unrichtig sind:

Falsche Daten:
{{FALSCHE_DATEN}}

Korrekte Daten:
{{KORREKTE_DATEN}}

Ich bitte Sie, die unrichtigen Daten unverzüglich zu berichtigen.

Zur Identifikation: {{IDENTIFIKATION}}

Bitte bestätigen Sie mir die Berichtigung schriftlich innerhalb der gesetzlichen Frist von einem Monat.

Mit freundlichen Grüßen
{{NAME}}`,
    placeholders: [
      { key: "{{NAME}}", description: "Dein vollständiger Name", required: true },
      { key: "{{FALSCHE_DATEN}}", description: "Die falschen/veralteten Daten", required: true },
      { key: "{{KORREKTE_DATEN}}", description: "Die richtigen Daten", required: true },
      { key: "{{IDENTIFIKATION}}", description: "Z.B. Kundennummer, E-Mail-Adresse", required: true }
    ],
    tips: [
      "Dokumentiere die falschen Daten mit Screenshots wenn möglich",
      "Gib die korrekten Daten eindeutig an",
      "Auch unvollständige Daten können ergänzt werden"
    ]
  },
  portability: {
    requestType: "portability",
    name: "Datenübertragbarkeit",
    icon: "📦",
    legalBasis: "Art. 20 DSGVO - Recht auf Datenübertragbarkeit",
    responseDeadline: "30 Tage",
    subject: "Antrag auf Datenübertragbarkeit (Art. 20 DSGVO)",
    body: `Sehr geehrte Damen und Herren,

hiermit mache ich von meinem Recht auf Datenübertragbarkeit gemäß Art. 20 DSGVO Gebrauch.

Ich bitte Sie, mir die mich betreffenden personenbezogenen Daten, die ich Ihnen bereitgestellt habe, in einem strukturierten, gängigen und maschinenlesbaren Format zu übermitteln.

Gewünschtes Format: {{FORMAT}}

Alternativ bitte ich Sie, die Daten direkt an folgenden Empfänger zu übermitteln:
{{EMPFAENGER}}

Zur Identifikation: {{IDENTIFIKATION}}

Bitte übermitteln Sie die Daten innerhalb der gesetzlichen Frist von einem Monat.

Mit freundlichen Grüßen
{{NAME}}`,
    placeholders: [
      { key: "{{NAME}}", description: "Dein vollständiger Name", required: true },
      { key: "{{FORMAT}}", description: "Z.B. JSON, CSV, XML", required: false },
      { key: "{{EMPFAENGER}}", description: "Name und Kontaktdaten des neuen Anbieters (optional)", required: false },
      { key: "{{IDENTIFIKATION}}", description: "Z.B. Kundennummer, E-Mail-Adresse", required: true }
    ],
    tips: [
      "Gilt nur für Daten, die du selbst bereitgestellt hast",
      "Gilt nur bei Verarbeitung aufgrund Einwilligung oder Vertrag",
      "Gängige Formate: JSON, CSV, XML",
      "Du kannst die Übertragung direkt an einen anderen Anbieter verlangen"
    ]
  },
  objection: {
    requestType: "objection",
    name: "Widerspruch",
    icon: "🛑",
    legalBasis: "Art. 21 DSGVO - Widerspruchsrecht",
    responseDeadline: "Unverzüglich",
    subject: "Widerspruch gegen die Datenverarbeitung (Art. 21 DSGVO)",
    body: `Sehr geehrte Damen und Herren,

hiermit widerspreche ich gemäß Art. 21 DSGVO der Verarbeitung meiner personenbezogenen Daten.

Art des Widerspruchs:
☐ Widerspruch aus Gründen meiner besonderen Situation (Art. 21 Abs. 1)
☐ Widerspruch gegen Direktwerbung (Art. 21 Abs. 2)

Begründung meiner besonderen Situation:
{{BEGRUENDUNG}}

Ich widerspreche insbesondere der Verarbeitung für folgende Zwecke:
{{ZWECKE}}

Zur Identifikation: {{IDENTIFIKATION}}

Ich erwarte, dass Sie die Verarbeitung meiner Daten für die genannten Zwecke unverzüglich einstellen.

Mit freundlichen Grüßen
{{NAME}}`,
    placeholders: [
      { key: "{{NAME}}", description: "Dein vollständiger Name", required: true },
      { key: "{{BEGRUENDUNG}}", description: "Warum die Verarbeitung dich besonders betrifft (bei Art. 21 Abs. 1)", required: false },
      { key: "{{ZWECKE}}", description: "Z.B. Werbung, Profiling, Datenhandel", required: true },
      { key: "{{IDENTIFIKATION}}", description: "Z.B. Kundennummer, E-Mail-Adresse", required: true }
    ],
    tips: [
      "Widerspruch gegen Direktwerbung muss IMMER befolgt werden",
      "Bei anderen Zwecken muss das Unternehmen Gründe abwägen",
      "Keine Begründung nötig bei Widerspruch gegen Werbung",
      "Widerspruch kann jederzeit und ohne Angabe von Gründen erfolgen"
    ]
  }
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  // Get request type from query params
  const requestType = event.queryStringParameters?.requestType || "access";

  try {
    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/templates/gdpr/${requestType}`, {
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

    // Fallback to local templates
    const template = GDPR_TEMPLATES[requestType];

    if (!template) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Template nicht gefunden", availableTypes: Object.keys(GDPR_TEMPLATES) })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        template: template
      })
    };

  } catch (error) {
    console.error("GDPR template error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Laden des Templates" })
    };
  }
};
