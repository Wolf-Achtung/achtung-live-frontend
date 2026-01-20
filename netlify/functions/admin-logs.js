// Netlify Function: Admin Activity Logs
// Returns activity and moderation logs

// In-memory logs (in production: use database)
let activityLogs = [];
let moderationLogs = [];

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

  // GET: Retrieve logs
  if (event.httpMethod === 'GET') {
    const type = event.queryStringParameters?.type || 'activity';
    const limit = parseInt(event.queryStringParameters?.limit) || 50;

    const logs = type === 'moderation' ? moderationLogs : activityLogs;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        activities: logs.slice(0, limit),
        total: logs.length,
        type: type
      })
    };
  }

  // POST: Add new log entry (internal use)
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');

      const logEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('de-DE'),
        ip: body.ip || 'unknown',
        action: body.action || 'unknown',
        status: body.status || 'unknown',
        details: body.details || '',
        contentPreview: body.contentPreview || null,
        moderationScores: body.moderationScores || null
      };

      // Add to activity logs
      activityLogs.unshift(logEntry);
      if (activityLogs.length > 1000) {
        activityLogs = activityLogs.slice(0, 1000);
      }

      // If blocked/warning, also add to moderation logs
      if (logEntry.status === 'blocked' || logEntry.status === 'warning') {
        moderationLogs.unshift(logEntry);
        if (moderationLogs.length > 500) {
          moderationLogs = moderationLogs.slice(0, 500);
        }
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, id: logEntry.id })
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

// Export for internal use
module.exports.addLog = (logData) => {
  const logEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString('de-DE'),
    ...logData
  };

  activityLogs.unshift(logEntry);
  if (activityLogs.length > 1000) {
    activityLogs = activityLogs.slice(0, 1000);
  }

  if (logEntry.status === 'blocked' || logEntry.status === 'warning') {
    moderationLogs.unshift(logEntry);
    if (moderationLogs.length > 500) {
      moderationLogs = moderationLogs.slice(0, 500);
    }
  }

  return logEntry;
};
