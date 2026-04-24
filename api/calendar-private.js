// Vercel serverless function — private endpoint.
// Validates a Google ID token sent by the browser, checks the email against
// a whitelist of staff emails (env var), and returns full event details if
// the caller is authorized. Otherwise returns 401.

const { fetchEvents } = require('./calendar.js');

module.exports = async function handler(req, res) {
  const apiKey     = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientId   = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const staffList  = (process.env.STAFF_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!apiKey || !calendarId || !clientId || staffList.length === 0) {
    return res.status(500).json({ error: 'missing env vars' });
  }

  // Token comes in as `Authorization: Bearer <id_token>`.
  const auth = req.headers.authorization || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'missing token' });
  }
  const idToken = match[1];

  // Verify the token with Google's tokeninfo endpoint.
  // Returns the decoded JWT payload if the signature + expiry are valid.
  let payload;
  try {
    const verify = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!verify.ok) {
      return res.status(401).json({ error: 'invalid token' });
    }
    payload = await verify.json();
  } catch (err) {
    return res.status(401).json({ error: 'token verification failed' });
  }

  // Sanity-check the audience (the token must have been minted for our client id)
  // and the email-verified flag (Google occasionally returns unverified gmail aliases).
  if (payload.aud !== clientId) {
    return res.status(401).json({ error: 'wrong audience' });
  }
  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    return res.status(401).json({ error: 'email not verified' });
  }

  const email = String(payload.email || '').toLowerCase();
  if (!staffList.includes(email)) {
    return res.status(403).json({ error: 'not authorized' });
  }

  // Authorized — fetch and return full events.
  const events = await fetchEvents(apiKey, calendarId);
  if (events.error) {
    return res.status(events.status || 502).json({ error: events.error });
  }

  // No edge cache for the private endpoint — content is per-user.
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ events: events.items, redacted: false });
};
