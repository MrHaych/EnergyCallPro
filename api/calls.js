/**
 * Call log persistence. Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in env.
 * GET        → returns all call log entries ordered by called_at DESC
 * POST       → upserts a single entry (conflict on place_id)
 * DELETE ?all=1 → deletes every entry
 */
const { createClient } = require('@supabase/supabase-js');

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  return createClient(url, key);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  let supabase;
  try {
    supabase = getClient();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('called_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { place_id, name, sector, outcome, note, time_label } = req.body || {};
    if (!place_id || !outcome) {
      return res.status(400).json({ error: 'Missing place_id or outcome' });
    }
    const { data, error } = await supabase
      .from('call_logs')
      .upsert(
        {
          place_id,
          name: name || '',
          sector: sector || '',
          outcome,
          note: note || '',
          time_label: time_label || '',
          called_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'place_id' }
      )
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    if (req.query.all === '1') {
      const { error } = await supabase
        .from('call_logs')
        .delete()
        .not('id', 'is', null);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
    const place_id = req.query.place_id;
    if (!place_id) return res.status(400).json({ error: 'Missing place_id' });
    const { error } = await supabase
      .from('call_logs')
      .delete()
      .eq('place_id', place_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
