import { NextRequest, NextResponse } from 'next/server';
import { PaypalCaptureBodySchema } from '../../../../lib/schemas';

function paypalBase() {
  const env = (process.env['PAYPAL_ENV'] || 'sandbox').toLowerCase();
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  const client = process.env['PAYPAL_CLIENT_ID'] || '';
  const secret = process.env['PAYPAL_CLIENT_SECRET'] || '';
  if (!client || !secret) throw new Error('PayPal credentials missing');
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Failed to get PayPal token');
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = PaypalCaptureBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const token = await getAccessToken();
    const cap = await fetch(`${paypalBase()}/v2/checkout/orders/${parsed.data.orderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await cap.json();
    if (!cap.ok) return NextResponse.json({ error: 'Capture failed', details: data }, { status: cap.status });
    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
