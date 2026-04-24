// Vercel serverless function — public endpoint.
// Returns calendar events with sensitive fields (title, description, location)
// redacted so visitors can see the rhythm but not the content.
// The full version lives at /api/calendar-private and requires a valid Google ID token.

module.exports = async function handler(req, res) {
  const apiKey     = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    return res.status(500).json({ error: 'missing env vars' });
  }

  const events = await fetchEvents(apiKey, calendarId);
  if (events.error) {
    return res.status(events.status || 502).json({ error: events.error });
  }

  // Redact: strip title, description, and location.
  const redacted = events.items.map((e) => ({
    id:          e.id,
    title:       null,
    description: '',
    location:    '',
    start:       e.start,
    end:         e.end,
    allDay:      e.allDay
  }));

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.status(200).json({
    events:   redacted,
    redacted: true,
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || null
  });
};

// ── Helpers shared with the private endpoint ───────────────────────────────
async function fetchEvents(apiKey, calendarId) {
  const now     = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 60);
  const timeMax = new Date(now);
  timeMax.setFullYear(timeMax.getFullYear() + 2);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
    new URLSearchParams({
      key:          apiKey,
      timeMin:      timeMin.toISOString(),
      timeMax:      timeMax.toISOString(),
      singleEvents: 'true',
      orderBy:      'startTime',
      maxResults:   '250'
    }).toString();

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return { error: 'upstream', status: 502 };
    }
    const data = await upstream.json();
    const items = (data.items || []).map((e) => ({
      id:          e.id,
      title:       e.summary || '(untitled)',
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
