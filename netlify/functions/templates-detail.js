// Netlify Function: Phase 11 - Privacy Templates - Template Detail
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

const TEMPLATE_DETAILS = {
  sm_bio_minimal: {
    id: "sm_bio_minimal",
    name: "Minimale Bio",
    category: "social_media",
    description: "Eine kurze, datenschutzfreundliche Bio ohne persönliche Identifikatoren",
    privacyScore: 95,
    privacyAnalysis: {
      piiCount: 0,
      locationRevealed: false,
      ageRevealed: false,
      employerRevealed: false
    },
    variants: [
      {
        id: "variant_creative",
        name: "Kreativ",
        content: "Kreativ unterwegs | {{HOBBY}} {{EMOJI}} | Immer neugierig",
        tone: "casual"
      },
      {
        id: "variant_minimal",
        name: "Ultra-Minimal",
        content: "{{EMOJI}} {{EMOJI2}} {{EMOJI3}}",
        tone: "minimal"
      },
      {
        id: "variant_mysterious",
        name: "Geheimnisvoll",
        content: "Manchmal hier, manchmal dort. Meist irgendwo dazwischen.",
        tone: "mysterious"
      },
      {
        id: "variant_coffee",
        name: "Kaffee-Lover",
        content: "Powered by ☕ | {{HOBBY}} enthusiast",
        tone: "casual"
      }
    ],
    customizable: true,
    placeholders: [
      {
        key: "{{HOBBY}}",
        description: "Ein Hobby (ohne zu spezifisch zu sein)",
        examples: ["Musik", "Kunst", "Sport", "Lesen", "Fotografie", "Gaming"]
      },
      {
        key: "{{EMOJI}}",
        description: "Ein passendes Emoji",
        examples: ["🎨", "📚", "🎵", "⚡", "🌟", "🎮"]
      },
      {
        key: "{{EMOJI2}}",
        description: "Zweites Emoji",
        examples: ["☕", "🌿", "🎧", "📷"]
      },
      {
        key: "{{EMOJI3}}",
        description: "Drittes Emoji",
        examples: ["✨", "🌙", "🔥", "💫"]
      }
    ],
    tips: [
      "Vermeide deinen echten Namen",
      "Keine Altersangaben oder Geburtsdaten",
      "Standort nur sehr allgemein (Land, nicht Stadt)",
      "Arbeitgeber weglassen oder nur Branche nennen"
    ],
    doNot: [
      "Geburtsdatum teilen",
      "Genauen Wohnort angeben",
      "Arbeitgeber + Position nennen",
      "Familienstand erwähnen",
      "Telefonnummer oder E-Mail einfügen"
    ]
  },
  gdpr_deletion: {
    id: "gdpr_deletion",
    name: "Löschungsanfrage",
    category: "gdpr_requests",
    description: "Formeller Antrag auf Löschung personenbezogener Daten nach Art. 17 DSGVO",
    privacyScore: 100,
    variants: [
      {
        id: "variant_formal",
        name: "Formell",
        content: `Sehr geehrte Damen und Herren,

hiermit mache ich von meinem Recht auf Löschung gemäß Art. 17 DSGVO (Datenschutz-Grundverordnung) Gebrauch.

Ich fordere Sie auf, sämtliche über mich gespeicherten personenbezogenen Daten unverzüglich und vollständig zu löschen.

Betroffen sind insbesondere:
{{DATENARTEN}}

Bitte bestätigen Sie die vollständige Löschung schriftlich innerhalb der gesetzlichen Frist von einem Monat.

Sollten Sie der Löschung nicht nachkommen können, bitte ich um eine schriftliche Begründung unter Angabe der Rechtsgrundlage.

Mit freundlichen Grüßen
{{NAME}}`,
        tone: "formal"
      },
      {
        id: "variant_short",
        name: "Kurz & Direkt",
        content: `Betreff: Löschung meiner Daten (Art. 17 DSGVO)

Guten Tag,

bitte löschen Sie alle meine personenbezogenen Daten aus Ihren Systemen.

Bestätigung innerhalb von 30 Tagen erbeten.

{{NAME}}`,
        tone: "direct"
      }
    ],
    customizable: true,
    placeholders: [
      {
        key: "{{DATENARTEN}}",
        description: "Welche Daten gelöscht werden sollen",
        examples: ["- E-Mail-Adresse und Kundenkonto", "- Bestellhistorie", "- Newsletter-Anmeldung", "- Alle gespeicherten Daten"]
      },
      {
        key: "{{NAME}}",
        description: "Dein Name (für formelle Anfragen rechtlich erforderlich)"
      }
    ],
    legalBasis: "Art. 17 DSGVO - Recht auf Löschung ('Recht auf Vergessenwerden')",
    responseDeadline: "30 Tage",
    tips: [
      "Per E-Mail an den Datenschutzbeauftragten senden",
      "Kopie der Anfrage für eigene Unterlagen aufbewahren",
      "Frist im Kalender notieren",
      "Nach 30 Tagen nachfassen wenn keine Antwort"
    ],
    doNot: [
      "Zu viele persönliche Details in der Anfrage preisgeben",
      "Drohungen oder aggressive Sprache verwenden"
    ]
  },
  gdpr_access: {
    id: "gdpr_access",
    name: "Auskunftsanfrage",
    category: "gdpr_requests",
    description: "Anfrage zur Auskunft über gespeicherte personenbezogene Daten nach Art. 15 DSGVO",
    privacyScore: 100,
    variants: [
      {
        id: "variant_comprehensive",
        name: "Umfassend",
        content: `Sehr geehrte Damen und Herren,

gemäß Art. 15 DSGVO bitte ich um Auskunft über die zu meiner Person gespeicherten Daten.

Insbesondere bitte ich um Mitteilung über:
1. Welche personenbezogenen Daten über mich gespeichert sind
2. Die Verarbeitungszwecke
3. Die Empfänger oder Kategorien von Empfängern
4. Die geplante Speicherdauer
5. Die Herkunft der Daten
6. Ob eine automatisierte Entscheidungsfindung/Profiling stattfindet

Bitte stellen Sie mir eine Kopie meiner Daten in einem gängigen elektronischen Format zur Verfügung.

Mit freundlichen Grüßen
{{NAME}}`,
        tone: "formal"
      }
    ],
    placeholders: [
      {
        key: "{{NAME}}",
        description: "Dein Name (zur Identifikation erforderlich)"
      }
    ],
    legalBasis: "Art. 15 DSGVO - Auskunftsrecht der betroffenen Person",
    responseDeadline: "30 Tage",
    tips: [
      "Du kannst dies kostenlos einmal pro Jahr anfragen",
      "Das Unternehmen darf deine Identität verifizieren"
    ]
  },
  email_marketing_optout: {
    id: "email_marketing_optout",
    name: "Marketing Abmeldung",
    category: "email_responses",
    description: "Widerspruch gegen Werbung und Marketing-Kommunikation",
    privacyScore: 100,
    variants: [
      {
        id: "variant_standard",
        name: "Standard",
        content: `Betreff: Widerspruch gegen Werbung

Guten Tag,

hiermit widerspreche ich der Nutzung meiner Daten für Werbezwecke gemäß Art. 21 DSGVO.

Bitte entfernen Sie meine E-Mail-Adresse {{EMAIL}} aus allen Werbe- und Marketing-Verteilern.

Dies umfasst:
- Newsletter
- Produktwerbung
- Partnerangebote
- Zufriedenheitsumfragen

Bitte bestätigen Sie die Umsetzung.

Mit freundlichen Grüßen`,
        tone: "formal"
      },
      {
        id: "variant_minimal",
        name: "Minimal",
        content: `Abmeldung von allen Marketingmails erbeten.

E-Mail: {{EMAIL}}

Danke.`,
        tone: "minimal"
      }
    ],
    placeholders: [
      {
        key: "{{EMAIL}}",
        description: "Die E-Mail-Adresse, die abgemeldet werden soll"
      }
    ],
    tips: [
      "Der Link am Ende von Newslettern ist oft schneller",
      "Bei Nicht-Reaktion: Beschwerde bei Datenschutzbehörde möglich"
    ]
  },
  job_cv_summary: {
    id: "job_cv_summary",
    name: "Lebenslauf-Kurzprofil",
    category: "job_application",
    description: "Professionelle Zusammenfassung für den Lebenslauf ohne sensible persönliche Daten",
    privacyScore: 78,
    variants: [
      {
        id: "variant_tech",
        name: "Tech/IT",
        content: `Erfahrene Fachkraft im Bereich {{BRANCHE}} mit Schwerpunkt {{SKILL}}.

Mehrjährige Berufserfahrung in {{REGION}}. Fundierte Kenntnisse in {{TECHNOLOGIEN}}.

Stärken: {{STAERKE1}}, {{STAERKE2}}, {{STAERKE3}}`,
        tone: "professional"
      },
      {
        id: "variant_general",
        name: "Allgemein",
        content: `Engagierte Fachkraft mit Expertise in {{BRANCHE}}.

Ich bringe {{ERFAHRUNG}} Berufserfahrung mit und bin spezialisiert auf {{SKILL}}.

Meine Arbeitsweise: {{ARBEITSWEISE}}`,
        tone: "professional"
      }
    ],
    placeholders: [
      {
        key: "{{BRANCHE}}",
        description: "Deine Branche (allgemein)",
        examples: ["IT", "Marketing", "Finanzen", "Gesundheitswesen"]
      },
      {
        key: "{{SKILL}}",
        description: "Hauptfähigkeit",
        examples: ["Projektmanagement", "Softwareentwicklung", "Kundenbetreuung"]
      },
      {
        key: "{{REGION}}",
        description: "Region (nicht Stadt)",
        examples: ["Süddeutschland", "DACH-Region", "Remote"]
      },
      {
        key: "{{ERFAHRUNG}}",
        description: "Erfahrungslevel",
        examples: ["mehrjährige", "umfangreiche", "langjährige"]
      }
    ],
    tips: [
      "Vermeide genaue Jahreszahlen - nutze 'mehrjährig' statt '5 Jahre'",
      "Nenne die Branche, nicht den konkreten Arbeitgeber",
      "Region statt Stadt angeben"
    ],
    doNot: [
      "Genaues Geburtsdatum angeben",
      "Familienstand erwähnen",
      "Foto beifügen (in DE freiwillig!)",
      "Frühere Arbeitgeber mit vollem Namen nennen"
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

  try {
    const templateId = event.queryStringParameters?.templateId;

    if (!templateId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "templateId Parameter erforderlich" })
      };
    }

    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/templates/${templateId}`, {
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

    // Fallback response
    const template = TEMPLATE_DETAILS[templateId];

    if (!template) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Template nicht gefunden" })
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
    console.error("Template detail error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Laden des Templates" })
    };
  }
};
