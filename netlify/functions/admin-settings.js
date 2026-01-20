// Netlify Function: Admin Settings Management
// Manages moderation settings and blacklist

// Default settings (in production: store in database)
let settings = {
  rateLimit: 30,
  rateLimitDaily: 500,
  enableAiModeration: true,
  moderationThreshold: 0.7,
  enableLogging: true,
  logBlockedOnly: false,
  blacklist: [
    'töten', 'umbringen', 'ermorden', 'abstechen', 'erschießen',
    'heil hitler', 'sieg heil', 'white power', 'ausländer raus',
    'kinderporno', 'cp ', 'csam',
    'nigeria prinz', 'lotterie gewinn', 'erbe millionen'
  ]
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET: Retrieve current settings
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(settings)
    };
  }

  // POST: Update settings
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');

      // Validate and update settings
      if (body.rateLimit !== undefined) {
        settings.rateLimit = Math.max(1, Math.min(1000, parseInt(body.rateLimit)));
      }
      if (body.rateLimitDaily !== undefined) {
        settings.rateLimitDaily = Math.max(1, Math.min(10000, parseInt(body.rateLimitDaily)));
      }
      if (body.enableAiModeration !== undefined) {
        settings.enableAiModeration = Boolean(body.enableAiModeration);
      }
      if (body.moderationThreshold !== undefined) {
        settings.moderationThreshold = Math.max(0, Math.min(1, parseFloat(body.moderationThreshold)));
      }
      if (body.enableLogging !== undefined) {
        settings.enableLogging = Boolean(body.enableLogging);
      }
      if (body.logBlockedOnly !== undefined) {
        settings.logBlockedOnly = Boolean(body.logBlockedOnly);
      }
      if (body.blacklist !== undefined && Array.isArray(body.blacklist)) {
        settings.blacklist = body.blacklist.map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          settings: settings
        })
      };

    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};

// Export settings for other functions
module.exports.getSettings = () => settings;
module.exports.getBlacklist = () => settings.blacklist;
