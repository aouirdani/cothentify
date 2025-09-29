import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env['STRIPE_WEBHOOK_SECRET'] || '';
  const key = process.env['STRIPE_SECRET_KEY'] || '';
  if (!sig || !secret || !key) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });

  const rawBody = await req.text();
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    const event = stripe.webhooks.constructEvent(rawBody, sig, secret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId = typeof session.subscription === 'string' ? session.subscription : undefined;
        const email = session.customer_details?.email || session.customer_email || 'unknown@example.com';
        const plan = typeof session.metadata?.['plan'] === 'string' ? session.metadata['plan'] : 'freemium';
        const billing = typeof session.metadata?.['billing'] === 'string' ? session.metadata['billing'] : 'monthly';
        // Forward to API for persistence
        const api = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';
        const token = process.env['WEBHOOK_API_TOKEN'] || '';
        await fetch(`${api}/api/v1/billing/status`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
          body: JSON.stringify({
            provider: 'stripe',
            externalId: subId,
            status: 'active',
            email,
            plan: plan.toUpperCase(),
            billing: billing.toUpperCase(),
            meta: session,
          }),
        }).catch(() => {});
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const statusMap: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused'> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'unpaid',
          paused: 'paused',
        };
        const status = statusMap[(sub.status || 'active').toString()] || 'active';
        const api = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';
        const token = process.env['WEBHOOK_API_TOKEN'] || '';
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
  } catch (error: unknown) {
    console.error('[stripe.webhook] error', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
