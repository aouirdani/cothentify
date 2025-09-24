import { NextRequest, NextResponse } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function base() {
  return process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_CLIENT_SECRET || '';
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('paypal token failed');
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const transmissionId = req.headers.get('paypal-transmission-id') || '';
    const transmissionTime = req.headers.get('paypal-transmission-time') || '';
    const certUrl = req.headers.get('paypal-cert-url') || '';
    const authAlgo = req.headers.get('paypal-auth-algo') || '';
    const transmissionSig = req.headers.get('paypal-transmission-sig') || '';
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
    const body = await req.text();
    const token = await getAccessToken();

    const verifyRes = await fetch(`${base()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    });
    const verify = await verifyRes.json();
    if (!verifyRes.ok || verify.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'verification failed', details: verify }, { status: 400 });
    }

    const event = JSON.parse(body);
    const type = event.event_type as string;
    // Orders CAPTURE events
    if (type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource || {};
      const orderId = resource?.supplementary_data?.related_ids?.order_id || resource?.id || 'unknown';
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = process.env.WEBHOOK_API_TOKEN || '';
      await fetch(`${api}/api/v1/billing/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ provider: 'paypal', externalId: orderId, status: 'active', meta: resource }),
      }).catch(() => {});
    }
    if (type === 'PAYMENT.CAPTURE.DENIED' || type === 'PAYMENT.CAPTURE.REFUNDED') {
      const resource = event.resource || {};
      const orderId = resource?.supplementary_data?.related_ids?.order_id || resource?.id || 'unknown';
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = process.env.WEBHOOK_API_TOKEN || '';
      await fetch(`${api}/api/v1/billing/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ provider: 'paypal', externalId: orderId, status: 'canceled', meta: resource }),
      }).catch(() => {});
    }
    // Subscription events (if you switch to PayPal Subscriptions API)
    if (type === 'BILLING.SUBSCRIPTION.ACTIVATED' || type === 'BILLING.SUBSCRIPTION.UPDATED') {
      const subId = (event.resource?.id as string) || 'unknown';
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = process.env.WEBHOOK_API_TOKEN || '';
      await fetch(`${api}/api/v1/billing/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ provider: 'paypal', externalId: subId, status: 'active', meta: event.resource }),
      }).catch(() => {});
    }
    if (type === 'BILLING.SUBSCRIPTION.CANCELLED' || type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      const subId = (event.resource?.id as string) || 'unknown';
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = process.env.WEBHOOK_API_TOKEN || '';
      await fetch(`${api}/api/v1/billing/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ provider: 'paypal', externalId: subId, status: 'canceled', meta: event.resource }),
      }).catch(() => {});
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[paypal.webhook] error', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
