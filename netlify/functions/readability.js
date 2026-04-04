// Netlify Function: Proxy for /api/v2/readability (Railway Backend)
// Readability metrics: Flesch-DE, Wiener Sachtextformel, CEFR

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_URL = `${API_BASE}/api/v2/readability`;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed' } })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.text || body.text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: { code: 'NO_TEXT', message: 'Kein Text angegeben' } })
      };
    }

    if (body.text.length > 50000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: { code: 'TEXT_TOO_LONG', message: 'Maximal 50.000 Zeichen erlaubt' } })
      };
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: body.text,
        language: body.language || 'de-DE'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('readability API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Lesbarkeits-Service nicht verfuegbar' }
        })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('readability proxy error:', error.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        success: false,
        error: { code: 'PROXY_ERROR', message: 'Verbindung zum Backend fehlgeschlagen' }
      })
    };
  }
};
