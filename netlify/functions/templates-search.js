// Netlify Function: Phase 11 - Privacy Templates - Search
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback search data
const SEARCHABLE_TEMPLATES = [
  { id: "sm_bio_minimal", name: "Minimale Bio", category: "social_media", tags: ["instagram", "twitter", "tiktok", "bio"], description: "Kurze Bio ohne persönliche Details" },
  { id: "sm_bio_professional", name: "Professionelle Bio", category: "social_media", tags: ["linkedin", "xing", "business"], description: "Business-fokussiert ohne Privates" },
  { id: "sm_bio_creative", name: "Kreative Bio", category: "social_media", tags: ["instagram", "twitter", "kreativ"], description: "Kreativ und anonym" },
  { id: "job_cv_summary", name: "CV Kurzprofil", category: "job_application", tags: ["bewerbung", "cv", "lebenslauf"], description: "Datenschutzfreundliches Kurzprofil" },
  { id: "job_cover_intro", name: "Anschreiben Einleitung", category: "job_application", tags: ["bewerbung", "anschreiben"], description: "Professioneller Einstieg" },
  { id: "form_registration", name: "Registrierung minimal", category: "online_forms", tags: ["registrierung", "anmeldung"], description: "Minimale Angaben für Registrierungen" },
  { id: "form_contact", name: "Kontaktanfrage", category: "online_forms", tags: ["kontakt", "anfrage"], description: "Sichere Kontaktaufnahme" },
  { id: "email_optout", name: "Newsletter Abmeldung", category: "email_responses", tags: ["newsletter", "abmeldung", "werbung"], description: "Höfliche Abmeldung" },
  { id: "email_data_request", name: "Datenanfrage Antwort", category: "email_responses", tags: ["daten", "anfrage"], description: "Auf Datenanfragen reagieren" },
  { id: "gdpr_access", name: "DSGVO Auskunft", category: "gdpr_requests", tags: ["dsgvo", "auskunft", "art15"], description: "Auskunftsanfrage nach Art. 15" },
  { id: "gdpr_deletion", name: "DSGVO Löschung", category: "gdpr_requests", tags: ["dsgvo", "löschung", "art17"], description: "Löschungsanfrage nach Art. 17" },
  { id: "gdpr_objection", name: "DSGVO Widerspruch", category: "gdpr_requests", tags: ["dsgvo", "widerspruch", "art21", "werbung"], description: "Widerspruch nach Art. 21" }
];

function searchTemplates(query) {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);

  return SEARCHABLE_TEMPLATES.filter(template => {
    const searchText = `${template.name} ${template.description} ${template.tags.join(' ')} ${template.category}`.toLowerCase();
    return words.every(word => searchText.includes(word));
  }).map(template => ({
    ...template,
    matchScore: calculateMatchScore(template, words)
  })).sort((a, b) => b.matchScore - a.matchScore);
}

function calculateMatchScore(template, words) {
  let score = 0;
  const name = template.name.toLowerCase();
  const tags = template.tags.join(' ').toLowerCase();

  words.forEach(word => {
    if (name.includes(word)) score += 10;
    if (tags.includes(word)) score += 5;
    if (template.description.toLowerCase().includes(word)) score += 2;
  });

  return score;
}

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

  const query = event.queryStringParameters?.q || "";
  const category = event.queryStringParameters?.category;
  const limit = parseInt(event.queryStringParameters?.limit) || 10;

  if (!query && !category) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Suchbegriff (q) oder Kategorie erforderlich" })
    };
  }

  try {
    // Try backend first
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (category) params.append("category", category);
      params.append("limit", limit.toString());

      const response = await fetch(`${API_BASE}/api/v2/templates/search?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using local search");
    }

    // Local search fallback
    let results = query ? searchTemplates(query) : SEARCHABLE_TEMPLATES;

    // Filter by category if specified
    if (category) {
      results = results.filter(t => t.category === category);
    }

    // Limit results
    results = results.slice(0, limit);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query: query,
        category: category,
        results: results,
        totalResults: results.length
      })
    };

  } catch (error) {
    console.error("Search error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler bei der Suche" })
    };
  }
};
