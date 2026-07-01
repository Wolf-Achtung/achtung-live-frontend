// Netlify Function: Admin Statistics
// Returns dashboard statistics

const crypto = require('crypto');

// In-memory stats (shared with content-moderation in production via database)
let stats = {
  requestsToday: 0,
  moderatedToday: 0,
  blockedToday: 0,
  rateLimitedToday: 0,
  lastReset: new Date().toDateString()
};

// Requires ADMIN_SECRET to be set in the Netlify environment. Fails closed
// (denies access) if it isn't configured, rather than leaving the endpoint open.
function isAuthorized(event) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  const provided = event.headers['x-admin-token'] || event.headers['X-Admin-Token'] || '';
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!isAuthorized(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, error: 'Nicht autorisiert' })
    };
  }

  // Reset stats if new day
  const today = new Date().toDateString();
  if (stats.lastReset !== today) {
    stats = {
      requestsToday: 0,
      moderatedToday: 0,
      blockedToday: 0,
      rateLimitedToday: 0,
      lastReset: today
    };
  }

  // In production: fetch from database
  // For demo: return current stats or demo data
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
      apiVersion: '14.0.0',
      apiStatus: 'online'
    })
  };
};

// Function to increment stats (called from content-moderation)
module.exports.incrementStat = (statName) => {
  if (stats[statName] !== undefined) {
    stats[statName]++;
  }
};
