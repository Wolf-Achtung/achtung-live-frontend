// Netlify Function: Phase 11 - Privacy Templates - List by Category
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

const TEMPLATES_DB = {
 social_media: [
 {
 id: "sm_bio_minimal",
 name: "Minimale Bio",
 description: "Kurze Bio ohne persönliche Details",
 privacyScore: 95,
 popularity: 1250,
 tags: ["instagram", "twitter", "tiktok"],
 preview: "Kreativ unterwegs | Kaffee-Enthusiast ",
 difficulty: "easy"
 },
 {
 id: "sm_bio_professional",
 name: "Professionelle Bio",
 description: "Business-fokussiert ohne Privates",
 privacyScore: 88,
 popularity: 890,
 tags: ["linkedin", "xing"],
 preview: "Marketing | Digital Strategy | Speaker",
 difficulty: "easy"
 },
 {
 id: "sm_bio_mysterious",
 name: "Mysteriöse Bio",
 description: "Geheimnisvoll und privat",
 privacyScore: 98,
 popularity: 720,
 tags: ["instagram", "twitter"],
 preview: "Manchmal hier, manchmal dort.",
 difficulty: "easy"
 },
 {
 id: "sm_bio_creative",
 name: "Kreative Bio",
 description: "Künstlerisch ohne persönliche Infos",
 privacyScore: 92,
 popularity: 650,
 tags: ["instagram", "behance"],
 preview: " Farben, Formen, Fantasie",
 difficulty: "easy"
 }
 ],
 job_application: [
 {
 id: "job_cover_intro",
 name: "Anschreiben-Einstieg",
 description: "Professioneller Start ohne zu viele Details",
 privacyScore: 75,
 popularity: 980,
 tags: ["bewerbung", "anschreiben"],
 preview: "Als erfahrene Fachkraft im Bereich...",
 difficulty: "medium"
 },
 {
 id: "job_cv_summary",
 name: "Lebenslauf-Kurzprofil",
 description: "Zusammenfassung ohne sensible Daten",
 privacyScore: 78,
 popularity: 870,
 tags: ["lebenslauf", "profil"],
 preview: "Mehrjährige Erfahrung in der IT-Branche...",
 difficulty: "medium"
 },
 {
 id: "job_reference_request",
 name: "Referenz-Anfrage",
 description: "Höfliche Bitte um Referenz",
 privacyScore: 82,
 popularity: 420,
 tags: ["referenz", "zeugnis"],
 preview: "Ich wende mich an Sie mit der Bitte...",
 difficulty: "easy"
 }
 ],
 online_forms: [
 {
 id: "form_registration_minimal",
 name: "Minimale Registrierung",
 description: "Nur das Nötigste angeben",
 privacyScore: 90,
 popularity: 1100,
 tags: ["registrierung", "account"],
 preview: "Vorname: [Initial] | PLZ: [Nur Region]",
 difficulty: "easy"
 },
 {
 id: "form_contact_safe",
 name: "Sicheres Kontaktformular",
 description: "Kontaktaufnahme ohne persönliche Daten",
 privacyScore: 85,
 popularity: 780,
 tags: ["kontakt", "anfrage"],
 preview: "Betreff: Allgemeine Anfrage...",
 difficulty: "easy"
 }
 ],
 email_responses: [
 {
 id: "email_marketing_optout",
 name: "Marketing Abmeldung",
 description: "Werbung abbestellen",
 privacyScore: 100,
 popularity: 1500,
 tags: ["abmeldung", "newsletter"],
 preview: "Hiermit widerspreche ich...",
 difficulty: "easy"
 },
 {
 id: "email_data_request_deny",
 name: "Datenanfrage ablehnen",
 description: "Unternehmen Daten verweigern",
 privacyScore: 100,
 popularity: 650,
 tags: ["datenschutz", "ablehnung"],
 preview: "Ich lehne die Weitergabe meiner Daten ab...",
 difficulty: "medium"
 },
 {
 id: "email_consent_withdraw",
 name: "Einwilligung widerrufen",
 description: "Datenschutz-Einwilligung zurückziehen",
 privacyScore: 100,
 popularity: 890,
 tags: ["widerruf", "einwilligung"],
 preview: "Hiermit widerrufe ich meine Einwilligung...",
 difficulty: "easy"
 }
 ],
 gdpr_requests: [
 {
 id: "gdpr_access",
 name: "Auskunftsanfrage",
 description: "Art. 15 DSGVO - Welche Daten sind gespeichert?",
 privacyScore: 100,
 popularity: 1200,
 tags: ["auskunft", "art15"],
 preview: "Antrag auf Auskunft gemäß Art. 15 DSGVO...",
 difficulty: "easy"
 },
 {
 id: "gdpr_deletion",
 name: "Löschungsanfrage",
 description: "Art. 17 DSGVO - Daten löschen lassen",
 privacyScore: 100,
 popularity: 1800,
 tags: ["löschung", "art17"],
 preview: "Antrag auf Löschung gemäß Art. 17 DSGVO...",
 difficulty: "easy"
 },
 {
 id: "gdpr_portability",
 name: "Datenübertragung",
 description: "Art. 20 DSGVO - Daten mitnehmen",
 privacyScore: 100,
 popularity: 450,
 tags: ["portabilität", "art20"],
 preview: "Antrag auf Datenübertragbarkeit...",
 difficulty: "medium"
 },
 {
 id: "gdpr_rectification",
 name: "Berichtigung",
 description: "Art. 16 DSGVO - Falsche Daten korrigieren",
 privacyScore: 100,
 popularity: 320,
 tags: ["berichtigung", "art16"],
 preview: "Antrag auf Berichtigung gemäß Art. 16 DSGVO...",
 difficulty: "easy"
 }
 ]
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
 const categoryId = event.queryStringParameters?.categoryId;

 if (!categoryId) {
 return {
 statusCode: 400,
 headers,
 body: JSON.stringify({ error: "categoryId Parameter erforderlich" })
 };
 }

 // Try backend first
 try {
 const response = await fetch(`${API_BASE}/api/v2/templates/category/${categoryId}`, {
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
 const templates = TEMPLATES_DB[categoryId] || [];

 const categoryNames = {
 social_media: "Social Media",
 job_application: "Bewerbungen",
 online_forms: "Online-Formulare",
 email_responses: "E-Mail Antworten",
 gdpr_requests: "DSGVO-Anfragen"
 };

 const categoryIcons = {
 social_media: "",
 job_application: "",
 online_forms: "",
 email_responses: "",
 gdpr_requests: ""
 };

 return {
 statusCode: 200,
 headers,
 body: JSON.stringify({
 success: true,
 category: {
 id: categoryId,
 name: categoryNames[categoryId] || categoryId,
 icon: categoryIcons[categoryId] || ""
 },
 templates: templates
 })
 };

 } catch (error) {
 console.error("Templates list error:", error);
 return {
 statusCode: 500,
 headers,
 body: JSON.stringify({ error: "Fehler beim Laden der Templates" })
 };
 }
};
