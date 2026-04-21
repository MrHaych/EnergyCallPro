/**
 * Approval request system for remote Claude unblocking.
 * GET  ?token=xxx          → returns current status (pending/approved/aborted)
 * POST ?token=xxx&action=approve|abort  → sets status (called by ntfy action buttons)
 * PUT  (body: {token, question}) → creates a new pending request
 */
const { createClient } = require('@supabase/supabase-js');

function getClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const supabase = getClient();
  const token = req.query.token;

  if (req.method === 'PUT') {
    const { token: t, question } = req.body || {};
    if (!t) return res.status(400).json({ error: 'Missing token' });
    const { data, error } = await supabase
      .from('approval_requests')
      .insert({ token: t, question: question || '', status: 'pending' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'GET') {
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const { data, error } = await supabase
      .from('approval_requests')
      .select('status')
      .eq('token', token)
      .single();
    if (error) return res.status(404).json({ status: 'not_found' });
    return res.status(200).json({ status: data.status });
  }

  if (req.method === 'POST') {
    const action = req.query.action;
    if (!token || !['approve', 'abort'].includes(action)) {
      return res.status(400).json({ error: 'Missing token or invalid action' });
    }
    const { error } = await supabase
      .from('approval_requests')
      .update({ status: action === 'approve' ? 'approved' : 'aborted', responded_at: new Date().toISOString() })
      .eq('token', token);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, status: action === 'approve' ? 'approved' : 'aborted' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
