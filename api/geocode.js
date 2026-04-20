/**
 * Proxies Geocoding API. Key: set GOOGLE_MAPS_API_KEY in Vercel → Settings → Environment Variables.
 */
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
  const address = typeof req.query.address === 'string' ? req.query.address.trim() : '';
  if (!address) {
    res.status(400).json({ error: 'Missing address' });
    return;
  }
  const url =
    'https://maps.googleapis.com/maps/api/geocode/json?' +
    new URLSearchParams({ address, key }).toString();
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Upstream request failed', status: 'ERROR' });
  }
};
