// Vercel serverless function — private endpoint.
// Receives the staff member's own Google OAuth access token and uses it to
// call the Calendar API on their behalf. Google enforces the permission check:
// if the signed-in user has access to the calendar (because Tian shared it
// with them), they get full event details. If not, they get 403 from Google.
// No staff whitelist needed — the calendar's own sharing list IS the whitelist.

const { fetchEvents } = require('./calendar.js');

module.exports = async function handler(req, res) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    return res.status(500).json({ error: 'missing GOOGLE_CALENDAR_ID' });
  }

  const auth  = req.headers.authorization || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'missing token' });
  }
  const accessToken = match[1];

  const events = await fetchEvents(accessToken, calendarId);
  if (events.error) {
    return res.status(events.status || 502).json({ error: events.error });
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ events: events.items, redacted: false });
};
