import { NextRequest, NextResponse } from 'next/server';
import { PaypalCreateBodySchema } from '../../../../lib/schemas';
import { getPriceUSD } from '../../../../lib/payments';

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
    const parsed = PaypalCreateBodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid body', details: parsed.error.flatten() }, { status: 400 });
    const { plan, billing } = parsed.data;
    const origin = process.env['NEXTAUTH_URL'] || new URL(req.url).origin;
    const accessToken = await getAccessToken();
    const returnUrl = new URL('/checkout/paypal/return', origin);
    returnUrl.searchParams.set('plan', plan);
    returnUrl.searchParams.set('billing', billing);
    const cancelUrl = new URL('/checkout/cancel', origin);
    const price = getPriceUSD(plan as any, billing as any);

    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: `Cothentify ${String(plan).toUpperCase()} (${billing})`,
            amount: { currency_code: price.currency, value: price.amount.toFixed(2) },
          },
        ],
        application_context: {
          return_url: returnUrl.toString(),
          cancel_url: cancelUrl.toString(),
          user_action: 'PAY_NOW',
        },
      }),
    });
    if (!orderRes.ok) {
      const text = await orderRes.text();
      return NextResponse.json({ error: 'PayPal order create failed', details: text }, { status: 500 });
    }
    const order = await orderRes.json();
    const approveLink = (order.links || []).find((l: any) => l.rel === 'approve')?.href;
    return NextResponse.json({ id: order.id, approveUrl: approveLink });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
