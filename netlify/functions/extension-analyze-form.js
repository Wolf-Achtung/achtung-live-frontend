// Netlify Function: Phase 6 - Browser Extension - Analyze Form
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Sensitive field keywords
const SENSITIVE_KEYWORDS = {
 critical: ['ssn', 'social_security', 'sozialversicherung', 'passport', 'ausweis', 'tax_id', 'steuernummer'],
 high: ['mother_maiden', 'mädchenname', 'credit_card', 'kreditkarte', 'cvv', 'security_code', 'birth_place', 'geburtsort'],
 medium: ['income', 'einkommen', 'salary', 'gehalt', 'bank_account', 'kontonummer', 'insurance', 'versicherung']
};

exports.handler = async (event, context) => {
 const headers = {
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Headers": "Content-Type",
 "Access-Control-Allow-Methods": "POST, OPTIONS",
 "Content-Type": "application/json"
 };

 if (event.httpMethod === "OPTIONS") {
 return { statusCode: 200, headers, body: "" };
 }

 if (event.httpMethod !== "POST") {
 return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
 }

 try {
 const body = JSON.parse(event.body || "{}");
 const { formFields, formAction, pageUrl, pageDomain, pageTitle } = body;

 if (!formFields || !Array.isArray(formFields)) {
 return { statusCode: 400, headers, body: JSON.stringify({ error: "formFields Array ist erforderlich" }) };
 }

 // Try backend first
 try {
 const response = await fetch(`${API_BASE}/api/v2/extension/analyze-form`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body)
 });

 if (response.ok) {
 const data = await response.json();
 return { statusCode: 200, headers, body: JSON.stringify(data) };
 }
 } catch (apiError) {
 console.log("Backend unavailable, using fallback");
 }

 // Fallback analysis
 const unusualFields = [];
 const sensitiveFields = [];
 const normalFields = [];

 formFields.forEach(field => {
 const searchText = `${field.name || ''} ${field.label || ''}`.toLowerCase();
 let isSensitive = false;

 // Check for critical fields
 for (const keyword of SENSITIVE_KEYWORDS.critical) {
 if (searchText.includes(keyword)) {
 unusualFields.push({
 field: field.name,
 label: field.label,
 reason: `${field.label || field.name} ist eine kritisch sensible Information`,
 severity: 'critical',
 recommendation: 'Frage nach, warum diese Information benötigt wird'
 });
 sensitiveFields.push(field);
 isSensitive = true;
 break;
 }
 }

 if (!isSensitive) {
 // Check for high severity
 for (const keyword of SENSITIVE_KEYWORDS.high) {
 if (searchText.includes(keyword)) {
 unusualFields.push({
 field: field.name,
 label: field.label,
 reason: `${field.label || field.name} enthält sensible persönliche Daten`,
 severity: 'high',
 recommendation: 'Prüfe die Datenschutzerklärung vor dem Ausfüllen'
 });
 sensitiveFields.push(field);
 isSensitive = true;
 break;
 }
 }
 }

 if (!isSensitive) {
 // Check for medium severity
 for (const keyword of SENSITIVE_KEYWORDS.medium) {
 if (searchText.includes(keyword)) {
 unusualFields.push({
 field: field.name,
 label: field.label,
 reason: `${field.label || field.name} sammelt finanzielle Daten`,
 severity: 'medium',
 recommendation: 'Erwäge, ob diese Angabe wirklich nötig ist'
 });
 sensitiveFields.push(field);
 isSensitive = true;
 break;
 }
 }
 }

 if (!isSensitive) {
 normalFields.push(field.name);
 }
 });

 // Calculate risk score
 const formRiskScore = Math.min(100, unusualFields.reduce((score, f) => {
 switch(f.severity) {
 case 'critical': return score + 35;
 case 'high': return score + 25;
 case 'medium': return score + 15;
 default: return score + 5;
 }
 }, 0));

 const dataMinimizationScore = normalFields.length / Math.max(1, formFields.length);

 return {
 statusCode: 200,
 headers,
 body: JSON.stringify({
 success: true,
 data: {
 formRiskScore,
 riskLevel: formRiskScore > 60 ? 'high' : formRiskScore > 30 ? 'medium' : 'low',
 totalFields: formFields.length,
 sensitiveFields: sensitiveFields.length,
 unusualFields,
 normalFields,
 dataMinimizationScore: Math.round(dataMinimizationScore * 100) / 100,
 warnings: generateWarnings(unusualFields, formFields.length),
 recommendations: generateRecommendations(unusualFields)
 }
 })
 };

 } catch (error) {
 console.error("Analyze form error:", error);
 return { statusCode: 500, headers, body: JSON.stringify({ error: "Fehler bei der Formular-Analyse" }) };
 }
};

function generateWarnings(unusualFields, totalFields) {
 const warnings = [];

 if (unusualFields.some(f => f.severity === 'critical')) {
 warnings.push(' Dieses Formular sammelt kritisch sensible Daten!');
 }

 if (unusualFields.length >= 3) {
 warnings.push(`Dieses Formular enthält ${unusualFields.length} sensible Felder`);
 }

 if (unusualFields.length > totalFields / 2) {
 warnings.push('Mehr als die Hälfte der Felder sammelt sensible Daten');
 }

 return warnings;
}

function generateRecommendations(unusualFields) {
 const recommendations = [];

 if (unusualFields.length > 0) {
 recommendations.push('Prüfe die Datenschutzerklärung vor dem Absenden');
 }

 if (unusualFields.some(f => f.severity === 'critical')) {
 recommendations.push('Frage den Anbieter, warum kritische Daten benötigt werden');
 }

 if (unusualFields.length >= 2) {
 recommendations.push('Erwäge, optionale Felder leer zu lassen');
 }

 if (recommendations.length === 0) {
 recommendations.push('Formular scheint normal zu sein');
 }

 return recommendations;
}
