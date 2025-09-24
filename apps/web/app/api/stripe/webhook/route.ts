import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!sig || !secret || !key) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });

  const rawBody = await req.text();
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' } as any);
    const event = stripe.webhooks.constructEvent(rawBody, sig, secret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as any;
        const subId = s.subscription as string | undefined;
        const email = s.customer_details?.email || s.customer_email || 'unknown@example.com';
        const plan = (s.metadata?.plan as any) || 'freemium';
        const billing = (s.metadata?.billing as any) || 'monthly';
        // Forward to API for persistence
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const token = process.env.WEBHOOK_API_TOKEN || '';
        await fetch(`${api}/api/v1/billing/status`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
          body: JSON.stringify({ provider: 'stripe', externalId: subId, status: 'active', email, plan: (plan || '').toUpperCase(), billing: (billing || '').toUpperCase(), meta: s }),
        }).catch(() => {});
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const statusMap: Record<string, any> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'unpaid',
          paused: 'paused',
        };
        const status = statusMap[(sub.status || 'active').toString()] || 'active';
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const token = process.env.WEBHOOK_API_TOKEN || '';
        await fetch(`${api}/api/v1/billing/status`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
          body: JSON.stringify({ provider: 'stripe', externalId: sub.id, status, meta: sub }),
        }).catch(() => {});
        break;
      }
      default:
        // ignore others
        break;
    }
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[stripe.webhook] error', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
