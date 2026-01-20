// Netlify Function: Content Moderation System
// Includes: Blacklist, AI Moderation, Rate Limiting, Logging

// In-memory storage (in production: use Redis/database)
const requestCounts = new Map();
const activityLogs = [];
const moderationLogs = [];

// Default settings
let settings = {
  rateLimit: 30, // requests per minute
  rateLimitDaily: 500, // requests per day
  enableAiModeration: true,
  moderationThreshold: 0.7,
  enableLogging: true,
  logBlockedOnly: false
};

// Default blacklist (German inappropriate terms)
let blacklist = [
  // Violence
  'töten', 'umbringen', 'ermorden', 'abstechen', 'erschießen',
  // Hate speech markers
  'heil hitler', 'sieg heil', 'white power', 'ausländer raus',
  // Explicit content markers
  'kinderporno', 'cp ', 'csam',
  // Scam/fraud
  'nigeria prinz', 'lotterie gewinn', 'erbe millionen'
];

// Rate limiting check
function checkRateLimit(ip) {
  const now = Date.now();
  const minuteAgo = now - 60000;
  const dayAgo = now - 86400000;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip);

  // Clean old entries
  const validRequests = requests.filter(time => time > dayAgo);
  requestCounts.set(ip, validRequests);

  // Check minute limit
  const recentRequests = validRequests.filter(time => time > minuteAgo);
  if (recentRequests.length >= settings.rateLimit) {
    return { limited: true, reason: 'minute_limit', retryAfter: 60 };
  }

  // Check daily limit
  if (validRequests.length >= settings.rateLimitDaily) {
    return { limited: true, reason: 'daily_limit', retryAfter: 3600 };
  }

  // Add current request
  validRequests.push(now);
  requestCounts.set(ip, validRequests);

  return { limited: false };
}

// Blacklist check
function checkBlacklist(text) {
  const lowerText = text.toLowerCase();

  for (const word of blacklist) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        blocked: true,
        reason: 'blacklist',
        matchedTerm: word
      };
    }
  }

  return { blocked: false };
}

// OpenAI Moderation API check
async function checkAiModeration(text) {
  if (!settings.enableAiModeration) {
    return { flagged: false };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('OpenAI API key not configured');
    return { flagged: false, error: 'API key not configured' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: text })
    });

    if (!response.ok) {
      console.error('OpenAI Moderation API error:', response.status);
      return { flagged: false, error: 'API error' };
    }

    const data = await response.json();
    const result = data.results[0];

    // Check if any category exceeds threshold
    const categories = result.category_scores;
    const flaggedCategories = [];

    for (const [category, score] of Object.entries(categories)) {
      if (score >= settings.moderationThreshold) {
        flaggedCategories.push({ category, score });
      }
    }

    if (flaggedCategories.length > 0 || result.flagged) {
      return {
        flagged: true,
        categories: flaggedCategories,
        scores: categories
      };
    }

    return { flagged: false, scores: categories };

  } catch (error) {
    console.error('AI Moderation error:', error);
    return { flagged: false, error: error.message };
  }
}

// Logging function
function logActivity(data) {
  if (!settings.enableLogging) return;
  if (settings.logBlockedOnly && data.status === 'safe') return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString('de-DE'),
    ...data
  };

  activityLogs.unshift(logEntry);

  // Keep only last 1000 entries
  if (activityLogs.length > 1000) {
    activityLogs.pop();
  }

  // If blocked/moderated, also add to moderation log
  if (data.status === 'blocked' || data.status === 'warning') {
    moderationLogs.unshift(logEntry);
    if (moderationLogs.length > 500) {
      moderationLogs.pop();
    }
  }
}

// Get client IP from request
function getClientIp(event) {
  return event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['x-real-ip']
    || event.headers['client-ip']
    || 'unknown';
}

// Mask IP for privacy
function maskIp(ip) {
  if (ip === 'unknown') return ip;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip.substring(0, ip.length - 3) + '***';
}

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

  const clientIp = getClientIp(event);
  const maskedIp = maskIp(clientIp);

  try {
    const body = JSON.parse(event.body || '{}');
    const text = body.text || '';
    const action = body.action || 'text-analysis';

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No text provided' })
      };
    }

    // 1. Rate Limiting Check
    const rateCheck = checkRateLimit(clientIp);
    if (rateCheck.limited) {
      logActivity({
        ip: maskedIp,
        action: action,
        status: 'rate_limited',
        details: rateCheck.reason
      });

      return {
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': rateCheck.retryAfter.toString()
        },
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          reason: rateCheck.reason,
          retryAfter: rateCheck.retryAfter
        })
      };
    }

    // 2. Blacklist Check
    const blacklistCheck = checkBlacklist(text);
    if (blacklistCheck.blocked) {
      logActivity({
        ip: maskedIp,
        action: action,
        status: 'blocked',
        details: `Blacklist: "${blacklistCheck.matchedTerm}"`,
        contentPreview: text.substring(0, 50) + '...'
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          allowed: false,
          blocked: true,
          reason: 'content_policy',
          message: 'Der Text enthält unzulässige Inhalte und wurde blockiert.'
        })
      };
    }

    // 3. AI Moderation Check
    const aiCheck = await checkAiModeration(text);
    if (aiCheck.flagged) {
      const categories = aiCheck.categories?.map(c => c.category).join(', ') || 'unknown';

      logActivity({
        ip: maskedIp,
        action: action,
        status: 'warning',
        details: `AI Moderation: ${categories}`,
        contentPreview: text.substring(0, 50) + '...',
        moderationScores: aiCheck.scores
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          allowed: false,
          flagged: true,
          reason: 'ai_moderation',
          categories: aiCheck.categories,
          message: 'Der Text wurde als potenziell problematisch erkannt.'
        })
      };
    }

    // Content is safe
    logActivity({
      ip: maskedIp,
      action: action,
      status: 'safe',
      details: `${text.length} Zeichen`
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        allowed: true,
        blocked: false,
        flagged: false,
        message: 'Content approved'
      })
    };

  } catch (error) {
    console.error('Moderation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Export logs and settings for admin functions
module.exports.getActivityLogs = () => activityLogs;
module.exports.getModerationLogs = () => moderationLogs;
module.exports.getSettings = () => settings;
module.exports.setSettings = (newSettings) => { settings = { ...settings, ...newSettings }; };
module.exports.getBlacklist = () => blacklist;
module.exports.setBlacklist = (newList) => { blacklist = newList; };
module.exports.getStats = () => {
  const today = new Date().toDateString();
  const todayLogs = activityLogs.filter(log =>
    new Date(log.timestamp).toDateString() === today
  );

  return {
    requestsToday: todayLogs.length,
    moderatedToday: todayLogs.filter(l => l.status === 'warning').length,
    blockedToday: todayLogs.filter(l => l.status === 'blocked').length,
    rateLimitedToday: todayLogs.filter(l => l.status === 'rate_limited').length
  };
};
