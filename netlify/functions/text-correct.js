// Netlify Function: Proxy for /api/v2/text-correct (Railway Backend)
// Professional text correction with edit levels L0-L3
// L0 handled locally via spell-check.js, L1-L3 via Railway AI

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_URL = `${API_BASE}/api/v2/text-correct`;

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

    if (body.text.length > 10000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: { code: 'TEXT_TOO_LONG', message: 'Maximal 10.000 Zeichen erlaubt' } })
      };
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: body.text,
        language: body.language || 'de-DE',
        level: body.level || 'L1',
        config: body.config || {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('text-correct API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Textkorrektur-Service nicht verfuegbar' }
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
    console.error('text-correct proxy error:', error.message);
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
