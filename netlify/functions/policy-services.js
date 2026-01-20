// Netlify Function: Phase 13 - Privacy Policy Analyzer - Known Services List
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback data for known privacy services
const KNOWN_SERVICES = [
 {
 id: "google",
 name: "Google",
 domain: "google.com",
 icon: "",
 category: "tech",
 overallScore: 45,
 lastUpdated: "2024-01-10",
 highlights: {
 good: ["Transparente Datenschutzerklärung", "Daten-Download verfügbar"],
 bad: ["Umfangreiche Datensammlung", "Tracking über Services hinweg"]
 }
 },
 {
 id: "facebook",
 name: "Facebook",
 domain: "facebook.com",
 icon: "",
 category: "social",
 overallScore: 35,
 lastUpdated: "2024-01-08",
 highlights: {
 good: ["Detaillierte Privatsphäre-Einstellungen"],
 bad: ["Komplexe Datenschutzerklärung", "Daten-Sharing mit Dritten", "Tracking"]
 }
 },
 {
 id: "amazon",
 name: "Amazon",
 domain: "amazon.de",
 icon: "",
 category: "retail",
 overallScore: 50,
 lastUpdated: "2024-01-05",
 highlights: {
 good: ["Klare Bestelldaten-Verwaltung"],
 bad: ["Personalisierte Werbung", "Alexa-Datensammlung"]
 }
 },
 {
 id: "apple",
 name: "Apple",
 domain: "apple.com",
 icon: "",
 category: "tech",
 overallScore: 75,
 lastUpdated: "2024-01-12",
 highlights: {
 good: ["Starke Verschlüsselung", "Privacy by Design", "App Tracking Transparency"],
 bad: ["Geschlossenes Ökosystem"]
 }
 },
 {
 id: "microsoft",
 name: "Microsoft",
 domain: "microsoft.com",
 icon: "🪟",
 category: "tech",
 overallScore: 55,
 lastUpdated: "2024-01-09",
 highlights: {
 good: ["Privacy Dashboard", "Klare Kategorisierung"],
 bad: ["Windows Telemetrie", "LinkedIn-Integration"]
 }
 },
 {
 id: "tiktok",
 name: "TikTok",
 domain: "tiktok.com",
 icon: "",
 category: "social",
 overallScore: 25,
 lastUpdated: "2024-01-11",
 highlights: {
 good: ["Jugendschutz-Funktionen"],
 bad: ["Umfangreiche Datensammlung", "Algorithmus-Tracking", "Geräte-Fingerprinting"]
 }
 },
 {
 id: "whatsapp",
 name: "WhatsApp",
 domain: "whatsapp.com",
 icon: "",
 category: "messaging",
 overallScore: 55,
 lastUpdated: "2024-01-07",
 highlights: {
 good: ["Ende-zu-Ende-Verschlüsselung"],
 bad: ["Metadaten-Sammlung", "Facebook-Integration"]
 }
 },
 {
 id: "signal",
 name: "Signal",
 domain: "signal.org",
 icon: "",
 category: "messaging",
 overallScore: 95,
 lastUpdated: "2024-01-06",
 highlights: {
 good: ["Minimale Datensammlung", "Open Source", "E2E-Verschlüsselung"],
 bad: []
 }
 },
 {
 id: "protonmail",
 name: "ProtonMail",
 domain: "proton.me",
 icon: "",
 category: "email",
 overallScore: 92,
 lastUpdated: "2024-01-04",
 highlights: {
 good: ["Zero-Access-Verschlüsselung", "Schweizer Datenschutz", "Open Source"],
 bad: []
 }
 },
 {
 id: "spotify",
 name: "Spotify",
 domain: "spotify.com",
 icon: "",
 category: "entertainment",
 overallScore: 50,
 lastUpdated: "2024-01-10",
 highlights: {
 good: ["Klare Musik-Daten-Nutzung"],
 bad: ["Hörverhalten-Tracking", "Personalisierte Werbung (Free)"]
 }
 }
];

const CATEGORIES = [
 { id: "tech", name: "Technologie", icon: "" },
 { id: "social", name: "Social Media", icon: "" },
 { id: "messaging", name: "Messaging", icon: "" },
 { id: "retail", name: "Online-Handel", icon: "" },
 { id: "email", name: "E-Mail", icon: "" },
 { id: "entertainment", name: "Unterhaltung", icon: "" }
];

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
 // Try backend first
 try {
 const response = await fetch(`${API_BASE}/api/v2/policy/services`, {
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

 // Parse query parameters for filtering
 const category = event.queryStringParameters?.category;
 const sortBy = event.queryStringParameters?.sort || "name"; // name, score, updated

 let filteredServices = [...KNOWN_SERVICES];

 // Filter by category
 if (category && category !== "all") {
 filteredServices = filteredServices.filter(s => s.category === category);
 }

 // Sort
 switch (sortBy) {
 case "score":
 filteredServices.sort((a, b) => b.overallScore - a.overallScore);
 break;
 case "updated":
 filteredServices.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
 break;
 default:
 filteredServices.sort((a, b) => a.name.localeCompare(b.name));
 }

 return {
 statusCode: 200,
 headers,
 body: JSON.stringify({
 success: true,
 services: filteredServices,
 categories: CATEGORIES,
 totalServices: KNOWN_SERVICES.length,
 averageScore: Math.round(KNOWN_SERVICES.reduce((sum, s) => sum + s.overallScore, 0) / KNOWN_SERVICES.length)
 })
 };

 } catch (error) {
 console.error("Services list error:", error);
 return {
 statusCode: 500,
 headers,
 body: JSON.stringify({ error: "Fehler beim Laden der Services" })
 };
 }
};
