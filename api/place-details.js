/**
 * Proxies Place Details. Key: GOOGLE_MAPS_API_KEY in Vercel env.
 */
const FIELDS =
  'name,formatted_phone_number,formatted_address,website,opening_hours,rating,business_status,types';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Missing GOOGLE_MAPS_API_KEY on server' });
    return;
  }
  const placeId = typeof req.query.place_id === 'string' ? req.query.place_id.trim() : '';
  if (!placeId) {
    res.status(400).json({ error: 'Missing place_id' });
    return;
  }
  const params = new URLSearchParams({
    place_id: placeId,
    fields: FIELDS,
    key,
  });
  const url = 'https://maps.googleapis.com/maps/api/place/details/json?' + params.toString();
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Upstream request failed' });
  }
};
