// Netlify Function: Proxy for /api/v2/text-improve (Railway Backend)
// AI-powered text rewriting in 6 style modes

const API_BASE = "https://achtung-live-backend-production.up.railway.app";
const API_URL = `${API_BASE}/api/v2/text-improve`;

const VALID_MODES = ['formal', 'simple', 'shorter', 'professional', 'academic', 'creative'];

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

    if (body.text.length > 5000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: { code: 'TEXT_TOO_LONG', message: 'Maximal 5.000 Zeichen erlaubt' } })
      };
    }

    const mode = VALID_MODES.includes(body.mode) ? body.mode : 'professional';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: body.text,
        language: body.language || 'de-DE',
        mode: mode,
        config: body.config || {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('text-improve API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Textverbesserungs-Service nicht verfuegbar' }
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
    console.error('text-improve proxy error:', error.message);
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
