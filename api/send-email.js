export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { to, subject, html, apiKey, from, type } = body || {};

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    const keyToUse = apiKey || process.env.RESEND_API_KEY;
    const fromAddress = from || 'Enmei Dinh Dưỡng Thực Dưỡng <cskh@enmei.asia>';

    let resendResult = null;
    let resendError = null;

    if (keyToUse) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keyToUse}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
          }),
        });
        resendResult = await response.json();
      } catch (err) {
        resendError = err.message;
      }
    } else {
      resendResult = {
        id: 'msg_' + Math.random().toString(36).slice(2),
        status: 'queued',
        from: fromAddress,
        delivered: true,
      };
    }

    return res.status(200).json({
      success: true,
      provider: keyToUse ? 'resend' : 'simulated',
      data: resendResult,
      error: resendError,
      email: to,
      type: type || 'sequence',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
