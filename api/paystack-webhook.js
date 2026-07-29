// ============================================================
// POST /api/paystack-webhook
// Paystack calls THIS endpoint (server-to-server) after every
// payment event. This is the source of truth for "money arrived"
// — never the browser, which a user can fake.
//
// Flow: verify HMAC signature -> handle charge.success ->
//       save to Supabase -> email receipt via Resend.
//
// Express analogy: app.post('/webhook', ...) with the classic
// Paystack signature check from their Node docs.
// ============================================================

const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Minimal Supabase REST insert — no SDK needed for one table.
// (PostgREST endpoint; the service role key bypasses RLS.)
async function saveDonation(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/donations`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      // If the reference already exists (webhook retries), update it
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify([row]),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert failed: ${res.status} ${text}`);
  }
}

async function sendReceipt({ email, name, amount, frequency, reference }) {
  if (!process.env.RESEND_API_KEY) return; // email is optional at first

  const pretty = `₦${Number(amount).toLocaleString('en-NG')}`;
  const freqText = frequency === 'monthly' ? 'monthly donation' : 'donation';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'FUPA Foundation <onboarding@resend.dev>',
      to: [email],
      subject: `Thank you for your ${freqText} to FUPA Foundation`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2B2B2B;">
          <div style="background: #1F4D42; color: #fff; padding: 28px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">FUPA Foundation Nigeria</h1>
            <p style="margin: 4px 0 0; color: #E8B44F; font-size: 12px; letter-spacing: 2px;">IGNITING DIGNITY. BUILDING FUTURES.</p>
          </div>
          <div style="border: 1px solid #E8E0D8; border-top: 0; padding: 32px; border-radius: 0 0 12px 12px; background: #FDF9F5;">
            <p>Dear ${name || 'Friend'},</p>
            <p>Your ${freqText} of <strong>${pretty}</strong> has been received. Thank you for standing with communities across Nigeria.</p>
            <p style="background:#fff; border:1px solid #E8E0D8; border-radius:8px; padding:14px 18px; font-size:14px;">
              <strong>Receipt reference:</strong> ${reference}
            </p>
            ${frequency === 'monthly'
              ? '<p style="font-size:14px; color:#6B6B6B;">This is a monthly gift — your card will be charged automatically each month. You can cancel anytime by replying to this email.</p>'
              : ''}
            <p>With gratitude,<br/>The FUPA Foundation Team</p>
          </div>
        </div>
      `,
    }),
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ---- 1. Verify this really came from Paystack ----
    // Paystack signs the payload with your SECRET key (HMAC SHA-512).
    // This is the pattern from Paystack's own Node/Express docs.
    const signature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // ---- 2. We only care about successful charges ----
    // (charge.success fires for one-time payments AND each
    //  monthly subscription charge.)
    if (event.event === 'charge.success') {
      const d = event.data;
      const metadata = d.metadata || {};

      await saveDonation({
        reference: d.reference,
        donor_name: metadata.donor_name || null,
        donor_email: d.customer?.email,
        amount: d.amount / 100, // kobo -> Naira
        currency: d.currency,
        frequency: d.plan?.plan_code ? 'monthly' : (metadata.frequency || 'once'),
        status: 'success',
        channel: d.channel,
        paystack_data: d,
        paid_at: d.paid_at || new Date().toISOString(),
      });

      // Email failures must NOT make the webhook fail —
      // Paystack would keep retrying and re-inserting.
      try {
        await sendReceipt({
          email: d.customer?.email,
          name: metadata.donor_name,
          amount: d.amount / 100,
          frequency: d.plan?.plan_code ? 'monthly' : (metadata.frequency || 'once'),
          reference: d.reference,
        });
      } catch (emailErr) {
        console.error('receipt email failed:', emailErr);
      }
    }

    // ---- 3. Always answer 200 fast ----
    // If Paystack doesn't get a 200 it retries for days.
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
