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
  const searchRadius = req.query.radius || '1609';
const keywords = ['', 'shop', 'food', 'service', 'church', 'office'];
try {
  let results = [];
  let seen = new Set();
  for (const keyword of keywords) {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: searchRadius,
      type: 'establishment',
      key,
    });
    if (keyword) params.set('keyword', keyword);
    let nextUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' + params.toString();
    for (let page = 0; page < 3; page++) {
      const r = await fetch(nextUrl);
      const data = await r.json();
      if (data.results) {
        for (const place of data.results) {
          if (!seen.has(place.place_id)) {
            seen.add(place.place_id);
            results.push(place);
          }
        }
      }
      if (data.next_page_token) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        nextUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=' + data.next_page_token + '&key=' + key;
      } else {
        break;
      }
    }
  }
    res.status(200).json({ results });
  } catch (e) {
    res.status(502).json({ error: 'Upstream request failed', results: [] });
  }
};
