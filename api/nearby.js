/**
 * Proxies Places Nearby Search. Key: GOOGLE_MAPS_API_KEY in Vercel env.
 */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Missing GOOGLE_MAPS_API_KEY on server', results: [] });
    return;
  }
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) {
    res.status(400).json({ error: 'Invalid lat, lng, or type', results: [] });
    return;
  }
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: '3000',
    type,
    key,
  });
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' + params.toString();
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Upstream request failed', results: [] });
  }
};
