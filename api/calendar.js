// Vercel serverless function — public endpoint.
// Authenticates as a Google service account that has only "free/busy" access
// to the calendar. That means Google itself strips out titles, descriptions,
// and locations before sending data back — so even a bug in this function
// can't leak names. We additionally null out the title field as defense in depth.

const { GoogleAuth } = require('google-auth-library');

let cachedAuth = null;
function getAuth() {
  if (cachedAuth) return cachedAuth;
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  cachedAuth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly']
  });
  return cachedAuth;
}

module.exports = async function handler(req, res) {
  const calendarId    = process.env.GOOGLE_CALENDAR_ID;
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return res.status(500).json({ error: 'missing env vars' });
  }

  let accessToken;
  try {
    const client = await getAuth().getClient();
    const tokenResp = await client.getAccessToken();
    accessToken = tokenResp.token;
  } catch (err) {
    return res.status(500).json({ error: 'service account auth failed' });
  }

  const events = await fetchEvents(accessToken, calendarId);
  if (events.error) {
    return res.status(events.status || 502).json({
      error:          events.error,
      upstreamStatus: events.upstreamStatus,
      upstreamBody:   events.upstreamBody
    });
  }

  // Defense in depth — service account already shouldn't see these, but null them anyway.
  const slim = events.items.map((e) => ({
    id:          e.id,
    title:       null,
    description: '',
    location:    '',
    start:       e.start,
    end:         e.end,
    allDay:      e.allDay
  }));

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    events:   slim,
    redacted: true,
    clientId: oauthClientId || null
  });
};

// ── Shared helper used by the private endpoint too ─────────────────────────
async function fetchEvents(accessToken, calendarId) {
  const now     = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 60);
  const timeMax = new Date(now);
  timeMax.setFullYear(timeMax.getFullYear() + 2);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
    new URLSearchParams({
      timeMin:      timeMin.toISOString(),
      timeMax:      timeMax.toISOString(),
      singleEvents: 'true',
      orderBy:      'startTime',
      maxResults:   '250'
    }).toString();

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return {
        error:          'upstream',
        status:         upstream.status === 401 || upstream.status === 403 ? upstream.status : 502,
        upstreamStatus: upstream.status,
        upstreamBody:   detail.slice(0, 500)
      };
    }
    const data = await upstream.json();
    const items = (data.items || []).map((e) => ({
      id:          e.id,
      title:       e.summary || null,
      description: e.description || '',
      location:    e.location || '',
      start:       (e.start && (e.start.dateTime || e.start.date)) || null,
      end:         (e.end   && (e.end.dateTime   || e.end.date))   || null,
      allDay:      !!(e.start && e.start.date && !e.start.dateTime)
    }));
    return { items };
  } catch (err) {
    return { error: 'fetch failed', status: 500 };
  }
}

module.exports.fetchEvents = fetchEvents;
