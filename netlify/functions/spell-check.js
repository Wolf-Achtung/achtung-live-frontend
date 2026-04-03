// Netlify Function: Professional Text Correction & Spell Check
// Uses LanguageTool API + readability metrics
// Based on: Amtliches Regelwerk der deutschen Rechtschreibung (Fassung 2024)
// Prompt Reference: DE-Referenzprompt v1.0.0

const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';

// Language code mapping with variants
const LANGUAGE_MAP = {
  'de': 'de-DE',
  'de-DE': 'de-DE',
  'de-AT': 'de-AT',
  'de-CH': 'de-CH',
  'en': 'en-US',
  'en-GB': 'en-GB',
  'en-US': 'en-US',
  'fr': 'fr',
  'es': 'es',
  'it': 'it'
};

// Severity mapping based on professional editorial standards
const SEVERITY_MAP = {
  'TYPOS': 'medium',
  'SPELLING': 'medium',
  'GRAMMAR': 'critical',
  'PUNCTUATION': 'medium',
  'TYPOGRAPHY': 'small',
  'STYLE': 'small',
  'REDUNDANCY': 'small',
  'CASING': 'medium',
  'CONFUSED_WORDS': 'critical',
  'COMPOUNDING': 'medium',
  'COLLOQUIALISMS': 'small',
  'MISC': 'small'
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
    const level = body.level || 'L1';
    const config = body.config || {};

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No text provided' })
      };
    }

    if (text.length > 20000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text too long. Maximum 20.000 characters.' })
      };
    }

    const startTime = Date.now();

    // Map language code
    const langCode = LANGUAGE_MAP[language] || 'de-DE';

    // Configure LanguageTool based on edit level
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('language', langCode);
    formData.append('enabledOnly', 'false');

    // Enable more rules for higher edit levels
    if (level === 'L2' || level === 'L3') {
      formData.append('level', 'picky');
    }

    // de-CH: mother tongue hint for ss/ß handling
    if (langCode === 'de-CH') {
      formData.append('motherTongue', 'de-CH');
    }

    // Call LanguageTool API
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

    // Filter corrections based on edit level
    const filteredMatches = filterByLevel(data.matches, level);

    // Process matches with enhanced categorization
    const corrections = filteredMatches.map(match => ({
      offset: match.offset,
      length: match.length,
      original: text.substring(match.offset, match.offset + match.length),
      message: match.message,
      shortMessage: match.shortMessage || match.message,
      replacements: match.replacements.slice(0, 5).map(r => r.value),
      rule: {
        id: match.rule.id,
        category: match.rule.category.name,
        type: getCorrectionType(match.rule.category.id),
        deCheck: mapToDeCheck(match.rule.category.id, match.rule.id)
      },
      severity: getSeverity(match.rule.category.id, match.rule.id),
      context: {
        text: match.context.text,
        offset: match.context.offset,
        length: match.context.length
      }
    }));

    // Generate corrected text (apply first suggestion for each match)
    let correctedText = text;
    let offsetAdjustment = 0;

    for (const match of filteredMatches) {
      if (match.replacements.length > 0) {
        const start = match.offset + offsetAdjustment;
        const end = start + match.length;
        const replacement = match.replacements[0].value;

        correctedText = correctedText.substring(0, start) + replacement + correctedText.substring(end);
        offsetAdjustment += replacement.length - match.length;
      }
    }

    // Generate marked changes (~~old~~ **new**)
    const markedChanges = generateMarkedChanges(text, filteredMatches);

    // Categorize errors with enhanced stats
    const stats = {
      total: corrections.length,
      spelling: corrections.filter(c => c.rule.type === 'spelling').length,
      grammar: corrections.filter(c => c.rule.type === 'grammar').length,
      punctuation: corrections.filter(c => c.rule.type === 'punctuation').length,
      style: corrections.filter(c => c.rule.type === 'style').length,
      bySeverity: {
        critical: corrections.filter(c => c.severity === 'critical').length,
        medium: corrections.filter(c => c.severity === 'medium').length,
        small: corrections.filter(c => c.severity === 'small').length
      }
    };

    // Calculate readability metrics
    const readability = calculateReadability(text, langCode);

    // Detect recurring patterns
    const patterns = detectPatterns(corrections);

    // Build executive summary
    const executiveSummary = buildSummary(corrections, stats, readability, level, langCode);

    const processingTime = Date.now() - startTime;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        language: langCode,
        level: level,
        executiveSummary: executiveSummary,
        originalText: text,
        correctedText: correctedText,
        markedChanges: markedChanges,
        corrections: corrections,
        stats: stats,
        readability: readability,
        patterns: patterns,
        hasErrors: corrections.length > 0,
        meta: {
          processingTime: processingTime,
          provider: 'languagetool',
          promptVersion: '1.0.0',
          matchesTotal: data.matches.length,
          matchesFiltered: filteredMatches.length
        }
      })
    };

  } catch (error) {
    console.error('Text correction error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Text correction service unavailable',
        message: error.message
      })
    };
  }
};

// Filter LanguageTool matches based on edit level
function filterByLevel(matches, level) {
  if (level === 'L0') {
    // Only spelling, grammar, punctuation - no style
    return matches.filter(m => {
      const cat = m.rule.category.id;
      return ['TYPOS', 'SPELLING', 'GRAMMAR', 'PUNCTUATION', 'CASING',
              'CONFUSED_WORDS', 'COMPOUNDING'].includes(cat);
    });
  }
  if (level === 'L1') {
    // L0 + redundancy
    return matches.filter(m => {
      const cat = m.rule.category.id;
      return ['TYPOS', 'SPELLING', 'GRAMMAR', 'PUNCTUATION', 'TYPOGRAPHY',
              'CASING', 'CONFUSED_WORDS', 'COMPOUNDING', 'REDUNDANCY'].includes(cat);
    });
  }
  // L2 and L3: all matches including style
  return matches;
}

// Enhanced correction type mapping
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
    'COLLOQUIALISMS': 'style',
    'MISC': 'other'
  };
  return typeMap[categoryId] || 'other';
}

// Map LanguageTool categories to DE-specific check areas (A-H)
function mapToDeCheck(categoryId, ruleId) {
  const ruleIdLower = (ruleId || '').toLowerCase();

  if (['TYPOS', 'SPELLING'].includes(categoryId) || ruleIdLower.includes('sz_ligatur'))
    return 'A';
  if (categoryId === 'CASING')
    return 'B';
  if (categoryId === 'COMPOUNDING')
    return 'C';
  if (ruleIdLower.includes('bindestrich') || ruleIdLower.includes('hyphen'))
    return 'D';
  if (categoryId === 'PUNCTUATION' || ruleIdLower.includes('komma') || ruleIdLower.includes('comma'))
    return 'E';
  if (ruleIdLower.includes('anfuehrung') || ruleIdLower.includes('quote'))
    return 'F';
  if (ruleIdLower.includes('gender'))
    return 'G';
  // Default: grammar or consistency
  if (categoryId === 'GRAMMAR' || categoryId === 'CONFUSED_WORDS')
    return 'E';

  return 'H';
}

// Get severity based on category and rule
function getSeverity(categoryId, ruleId) {
  // Critical: grammar errors that change meaning
  const ruleIdLower = (ruleId || '').toLowerCase();
  if (ruleIdLower.includes('dass_das') || ruleIdLower.includes('confused'))
    return 'critical';

  return SEVERITY_MAP[categoryId] || 'small';
}

// Generate marked changes text
function generateMarkedChanges(originalText, matches) {
  if (matches.length === 0) return originalText;

  let result = '';
  let lastEnd = 0;

  // Sort matches by offset
  const sorted = [...matches].sort((a, b) => a.offset - b.offset);

  for (const match of sorted) {
    // Add unchanged text before this match
    result += originalText.substring(lastEnd, match.offset);

    const original = originalText.substring(match.offset, match.offset + match.length);
    const replacement = match.replacements.length > 0 ? match.replacements[0].value : '';

    if (replacement) {
      result += `~~${original}~~ **${replacement}**`;
    } else {
      result += `~~${original}~~`;
    }

    lastEnd = match.offset + match.length;
  }

  // Add remaining text
  result += originalText.substring(lastEnd);
  return result;
}

// Calculate readability metrics
function calculateReadability(text, langCode) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w, langCode), 0);

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllables / Math.max(wordCount, 1);
  const avgWordLength = words.reduce((sum, w) => sum + w.replace(/[^a-zäöüßàâéèêëîïôùûüçñ]/gi, '').length, 0) / Math.max(wordCount, 1);

  // Flesch Reading Ease adapted for German (Amstad formula)
  // FRE_DE = 180 - ASL - (58.5 * ASW)
  const fleschDE = Math.round(180 - avgSentenceLength - (58.5 * avgSyllablesPerWord));
  const fleschClamped = Math.max(0, Math.min(100, fleschDE));

  // Wiener Sachtextformel (simplified variant 1)
  // WSTF = 0.1935 * MS + 0.1672 * SL + 0.1297 * IW - 0.0327 * ES - 0.875
  // MS = % words with 3+ syllables, SL = avg sentence length, IW = % words > 6 chars, ES = % single-syllable words
  const longSyllWords = words.filter(w => countSyllables(w, langCode) >= 3).length;
  const longCharWords = words.filter(w => w.replace(/[^a-zäöüß]/gi, '').length > 6).length;
  const shortSyllWords = words.filter(w => countSyllables(w, langCode) === 1).length;
  const MS = (longSyllWords / Math.max(wordCount, 1)) * 100;
  const IW = (longCharWords / Math.max(wordCount, 1)) * 100;
  const ES = (shortSyllWords / Math.max(wordCount, 1)) * 100;
  const wstf = Math.round((0.1935 * MS + 0.1672 * avgSentenceLength + 0.1297 * IW - 0.0327 * ES - 0.875) * 10) / 10;

  // Map to CEFR level
  const cefr = mapToCEFR(fleschClamped);

  // Sentence length distribution
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const longestIdx = sentenceLengths.indexOf(Math.max(...sentenceLengths));

  return {
    fleschDE: fleschClamped,
    fleschLabel: getFleschLabel(fleschClamped),
    wienerSachtextformel: Math.max(0, wstf),
    cefr: cefr,
    cefrLabel: getCEFRLabel(cefr),
    wordCount: wordCount,
    sentenceCount: sentenceCount,
    paragraphCount: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    longestSentence: sentenceCount > 0 ? {
      length: sentenceLengths[longestIdx] || 0,
      text: (sentences[longestIdx] || '').trim().substring(0, 100)
    } : null,
    distribution: {
      short: sentenceLengths.filter(l => l <= 8).length,
      medium: sentenceLengths.filter(l => l > 8 && l <= 15).length,
      long: sentenceLengths.filter(l => l > 15 && l <= 25).length,
      veryLong: sentenceLengths.filter(l => l > 25).length
    }
  };
}

// Count syllables (heuristic, optimized for German)
function countSyllables(word, langCode) {
  const clean = word.toLowerCase().replace(/[^a-zäöüßàâéèêëîïôùûüçñ]/g, '');
  if (clean.length <= 2) return 1;

  let vowelGroups = 0;
  let lastWasVowel = false;
  const vowels = 'aeiouyäöüàâéèêëîïôùûü';

  for (const char of clean) {
    const isVowel = vowels.includes(char);
    if (isVowel && !lastWasVowel) {
      vowelGroups++;
    }
    lastWasVowel = isVowel;
  }

  // German adjustments
  if (langCode && langCode.startsWith('de')) {
    // "ie" counts as one syllable
    vowelGroups -= (clean.match(/ie/g) || []).length;
    // Silent "e" at end less common in German than English
  }

  return Math.max(1, vowelGroups);
}

function getFleschLabel(score) {
  if (score >= 80) return 'Sehr leicht';
  if (score >= 65) return 'Leicht';
  if (score >= 50) return 'Mittlere Schwierigkeit';
  if (score >= 35) return 'Schwierig';
  if (score >= 20) return 'Sehr schwierig';
  return 'Extrem schwierig';
}

function mapToCEFR(fleschScore) {
  if (fleschScore >= 80) return 'A1';
  if (fleschScore >= 70) return 'A2';
  if (fleschScore >= 60) return 'B1';
  if (fleschScore >= 45) return 'B2';
  if (fleschScore >= 30) return 'C1';
  return 'C2';
}

function getCEFRLabel(cefr) {
  const labels = {
    'A1': 'Anfaenger',
    'A2': 'Grundlegend',
    'B1': 'Mittelstufe',
    'B2': 'Fortgeschritten',
    'C1': 'Fachkundig',
    'C2': 'Annaehernd muttersprachlich'
  };
  return labels[cefr] || cefr;
}

// Detect recurring error patterns for learning tips
function detectPatterns(corrections) {
  const patternCounts = {};

  for (const c of corrections) {
    const key = c.rule.type + ':' + (c.rule.id || 'unknown');
    if (!patternCounts[key]) {
      patternCounts[key] = {
        pattern: c.rule.category,
        type: c.rule.type,
        ruleId: c.rule.id,
        deCheck: c.rule.deCheck,
        count: 0,
        examples: []
      };
    }
    patternCounts[key].count++;
    if (patternCounts[key].examples.length < 2) {
      patternCounts[key].examples.push({
        original: c.original,
        suggestion: c.replacements[0] || ''
      });
    }
  }

  // Return top patterns with tips
  return Object.values(patternCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(p => ({
      pattern: p.pattern,
      type: p.type,
      deCheck: p.deCheck,
      frequency: p.count,
      examples: p.examples,
      tip: getPatternTip(p.type, p.ruleId)
    }));
}

function getPatternTip(type, ruleId) {
  const ruleIdLower = (ruleId || '').toLowerCase();

  if (ruleIdLower.includes('dass_das') || ruleIdLower.includes('das_dass'))
    return 'Probe: Kann man "dieses/jenes/welches" einsetzen? Dann "das". Sonst "dass".';
  if (ruleIdLower.includes('komma') || ruleIdLower.includes('comma'))
    return 'Komma ist im Deutschen ein grammatisches Zeichen: Nebensaetze, Infinitivgruppen und Zusaetze werden durch Komma abgetrennt.';
  if (type === 'spelling')
    return 'Tipp: Bei Unsicherheit hilft der Duden als Nachschlagewerk. Achtung bei Fremdwoertern: integrierte vs. fremde Schreibung konsistent halten.';
  if (type === 'grammar')
    return 'Grammatikfehler aendern oft den Sinn. Besonders bei Kasus, Kongruenz und Satzbau genau pruefen.';
  if (type === 'punctuation')
    return 'Deutsche Zeichensetzung: Komma vor Nebensaetzen (dass, weil, wenn...), paarige Kommas bei Einschueben, Punkt nach Abkuerzungen.';
  if (type === 'style')
    return 'Stilhinweise sind Empfehlungen, keine Pflicht. Pruefen Sie, ob die Aenderung zum Register Ihres Textes passt.';
  return 'Wiederkehrende Fehler gezielt ueben: einmal verstanden, dauerhaft vermieden.';
}

// Build executive summary
function buildSummary(corrections, stats, readability, level, langCode) {
  const levelNames = {
    'L0': 'Proofread',
    'L1': 'Proofread + Klarheit',
    'L2': 'Line Edit',
    'L3': 'Copyedit'
  };

  if (corrections.length === 0) {
    return `Keine Fehler gefunden (Level: ${levelNames[level] || level}). ` +
      `Lesbarkeit: ${readability.fleschLabel} (Flesch ${readability.fleschDE}, CEFR ${readability.cefr}). ` +
      `${readability.wordCount} Woerter, ${readability.sentenceCount} Saetze.`;
  }

  const parts = [];

  // Error summary
  const errorParts = [];
  if (stats.bySeverity.critical > 0) errorParts.push(`${stats.bySeverity.critical} kritisch`);
  if (stats.bySeverity.medium > 0) errorParts.push(`${stats.bySeverity.medium} mittel`);
  if (stats.bySeverity.small > 0) errorParts.push(`${stats.bySeverity.small} klein`);
  parts.push(`${corrections.length} Korrekturen (${errorParts.join(', ')}).`);

  // Category breakdown
  const catParts = [];
  if (stats.spelling > 0) catParts.push(`${stats.spelling} Rechtschreibung`);
  if (stats.grammar > 0) catParts.push(`${stats.grammar} Grammatik`);
  if (stats.punctuation > 0) catParts.push(`${stats.punctuation} Zeichensetzung`);
  if (stats.style > 0) catParts.push(`${stats.style} Stil`);
  if (catParts.length > 0) parts.push(`Kategorien: ${catParts.join(', ')}.`);

  // Readability
  parts.push(`Lesbarkeit: ${readability.fleschLabel} (Flesch ${readability.fleschDE}, CEFR ${readability.cefr}).`);

  // Long sentences warning
  if (readability.distribution.veryLong > 0) {
    parts.push(`${readability.distribution.veryLong} sehr lange Saetze (>25 Woerter) gefunden.`);
  }

  return parts.join(' ');
}
