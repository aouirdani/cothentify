import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const priceEnvMap: Record<string, { monthly?: string; yearly?: string }> = {
  essential: { monthly: process.env['STRIPE_PRICE_ESSENTIAL_MONTHLY'], yearly: process.env['STRIPE_PRICE_ESSENTIAL_YEARLY'] },
  premium: { monthly: process.env['STRIPE_PRICE_PREMIUM_MONTHLY'], yearly: process.env['STRIPE_PRICE_PREMIUM_YEARLY'] },
  professional: { monthly: process.env['STRIPE_PRICE_PROFESSIONAL_MONTHLY'], yearly: process.env['STRIPE_PRICE_PROFESSIONAL_YEARLY'] },
};

const Body = z.object({
  plan: z.enum(['essential', 'premium', 'professional']).transform((value) => value as 'essential' | 'premium' | 'professional'),
  billing: z.enum(['monthly', 'yearly']).transform((value) => value as 'monthly' | 'yearly'),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const { plan, billing, email, name } = parsed.data;
  const stripeKey = process.env['STRIPE_SECRET_KEY'];
  if (!stripeKey || !priceEnvMap[plan]) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  const priceId = priceEnvMap[plan]?.[billing];
  if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 400 });

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    // Create or reuse customer by email
    let customerId: string | undefined;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data?.[0]?.id;
    }
    let customer = customerId ? await stripe.customers.retrieve(customerId) : null;
    if (!customer || (typeof customer === 'object' && 'deleted' in customer && customer.deleted)) {
      const created = await stripe.customers.create({ email, name });
      customer = created;
    }
    const custId = typeof customer === 'string' ? customer : customer.id;

    const subscription = await stripe.subscriptions.create({
      customer: custId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { plan, billing, email: email || '' },
    });
    const latestInvoice = subscription.latest_invoice;
    const paymentIntent =
      typeof latestInvoice === 'string'
        ? null
        : latestInvoice?.payment_intent && typeof latestInvoice.payment_intent !== 'string'
          ? latestInvoice.payment_intent
          : null;
    const clientSecret = paymentIntent?.client_secret;
    if (!clientSecret) return NextResponse.json({ error: 'No client secret' }, { status: 400 });
    return NextResponse.json({ clientSecret });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
