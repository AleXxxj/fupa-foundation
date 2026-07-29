// ============================================================
// POST /api/donate
// Initializes a Paystack transaction and returns the checkout
// URL. Express analogy: app.post('/api/donate', handler) —
// same (req, res), but Vercel spins it up on demand.
//
// Body: { name, email, amount, frequency }  amount in NAIRA
// Returns: { authorization_url, reference }
// ============================================================

const PAYSTACK_BASE = 'https://api.paystack.co';

async function paystack(path, options = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok || data.status === false) {
    throw new Error(data.message || `Paystack error on ${path}`);
  }
  return data;
}

module.exports = async (req, res) => {
  // Only POST allowed (like app.post — but here we enforce it manually)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, amount, frequency } = req.body || {};

    // ---- Validation (never trust the browser) ----
    const naira = Number(amount);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (!naira || naira < 1000) {
      return res.status(400).json({ error: 'Minimum donation is ₦1,000.' });
    }
    if (naira > 50_000_000) {
      return res.status(400).json({ error: 'For donations above ₦50m, please contact us directly.' });
    }
    const isMonthly = frequency === 'monthly';
    const koboAmount = Math.round(naira * 100); // Paystack works in kobo

    // ---- For monthly donations: find or create a Plan ----
    // A Plan is Paystack's "subscription template". Subscribing the
    // donor's card to a plan makes Paystack auto-charge them monthly.
    let planCode;
    if (isMonthly) {
      const planName = `FUPA Monthly NGN ${naira}`;

      // Reuse an existing plan for this amount if we made one before,
      // so we don't clutter the Paystack dashboard with duplicates.
      const existing = await paystack(
        `/plan?amount=${koboAmount}&interval=monthly&status=active`
      );
      const match = (existing.data || []).find((p) => p.name === planName);

      if (match) {
        planCode = match.plan_code;
      } else {
        const created = await paystack('/plan', {
          method: 'POST',
          body: JSON.stringify({
            name: planName,
            interval: 'monthly',
            amount: koboAmount,
            currency: 'NGN',
          }),
        });
        planCode = created.data.plan_code;
      }
    }

    // ---- Initialize the transaction ----
    const init = await paystack('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: koboAmount,
        currency: 'NGN',
        callback_url: `${process.env.SITE_URL}/thanks.html`,
        ...(planCode ? { plan: planCode } : {}),
        metadata: {
          donor_name: name || 'Anonymous',
          frequency: isMonthly ? 'monthly' : 'once',
          custom_fields: [
            {
              display_name: 'Donor Name',
              variable_name: 'donor_name',
              value: name || 'Anonymous',
            },
          ],
        },
      }),
    });

    // The webhook (api/paystack-webhook.js) records the donation
    // once Paystack confirms payment — the source of truth is the
    // webhook, never the browser.
    return res.status(200).json({
      authorization_url: init.data.authorization_url,
      reference: init.data.reference,
    });
  } catch (err) {
    console.error('donate error:', err);
    return res.status(500).json({
      error: 'Could not start the donation. Please try again in a moment.',
    });
  }
};
