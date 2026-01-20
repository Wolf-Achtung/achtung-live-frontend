// Netlify Function: Spell Check and Grammar Correction
// Uses LanguageTool API (free, supports multiple languages)

const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';

// Language code mapping
const LANGUAGE_MAP = {
  'de': 'de-DE',
  'en': 'en-US',
  'fr': 'fr',
  'es': 'es',
  'it': 'it'
};

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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const text = body.text || '';
    const language = body.language || 'de';

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No text provided' })
      };
    }

    // Map language code
    const langCode = LANGUAGE_MAP[language] || 'de-DE';

    // Call LanguageTool API
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('language', langCode);
    formData.append('enabledOnly', 'false');

    const response = await fetch(LANGUAGETOOL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }

    const data = await response.json();

    // Process matches (errors/suggestions)
    const corrections = data.matches.map(match => ({
      offset: match.offset,
      length: match.length,
      message: match.message,
      shortMessage: match.shortMessage || match.message,
      replacements: match.replacements.slice(0, 5).map(r => r.value),
      rule: {
        id: match.rule.id,
        category: match.rule.category.name,
        type: getCorrectionType(match.rule.category.id)
      },
      context: {
        text: match.context.text,
        offset: match.context.offset,
        length: match.context.length
      }
    }));

    // Generate corrected text (apply first suggestion for each match)
    let correctedText = text;
    let offsetAdjustment = 0;

    for (const match of data.matches) {
      if (match.replacements.length > 0) {
        const start = match.offset + offsetAdjustment;
        const end = start + match.length;
        const replacement = match.replacements[0].value;

        correctedText = correctedText.substring(0, start) + replacement + correctedText.substring(end);
        offsetAdjustment += replacement.length - match.length;
      }
    }

    // Categorize errors
    const stats = {
      total: corrections.length,
      spelling: corrections.filter(c => c.rule.type === 'spelling').length,
      grammar: corrections.filter(c => c.rule.type === 'grammar').length,
      punctuation: corrections.filter(c => c.rule.type === 'punctuation').length,
      style: corrections.filter(c => c.rule.type === 'style').length
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        language: langCode,
        originalText: text,
        correctedText: correctedText,
        corrections: corrections,
        stats: stats,
        hasErrors: corrections.length > 0
      })
    };

  } catch (error) {
    console.error('Spell check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Spell check service unavailable',
        message: error.message
      })
    };
  }
};

function getCorrectionType(categoryId) {
  const typeMap = {
    'TYPOS': 'spelling',
    'SPELLING': 'spelling',
    'GRAMMAR': 'grammar',
    'PUNCTUATION': 'punctuation',
    'TYPOGRAPHY': 'punctuation',
    'STYLE': 'style',
    'REDUNDANCY': 'style',
    'CASING': 'spelling',
    'CONFUSED_WORDS': 'grammar',
    'COMPOUNDING': 'spelling',
    'COLLOQUIALISMS': 'style'
  };
  return typeMap[categoryId] || 'other';
}
