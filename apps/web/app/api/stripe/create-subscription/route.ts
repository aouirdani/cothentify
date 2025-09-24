import { NextRequest, NextResponse } from 'next/server';

const priceEnvMap: Record<string, { monthly?: string; yearly?: string }> = {
  essential: { monthly: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY, yearly: process.env.STRIPE_PRICE_ESSENTIAL_YEARLY },
  premium: { monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY, yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY },
  professional: { monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY, yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY },
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const plan = (body?.plan || '').toLowerCase();
  const billing = (body?.billing || 'monthly').toLowerCase();
  const email = body?.email as string | undefined;
  const name = body?.name as string | undefined;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || !priceEnvMap[plan]) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  const priceId = (priceEnvMap[plan] as any)?.[billing];
  if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 400 });

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' } as any);
    // Create or reuse customer by email
    let customerId: string | undefined;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data?.[0]?.id;
    }
    const customer = customerId ? await stripe.customers.retrieve(customerId) : await stripe.customers.create({ email, name });
    const custId = (customer as any).id as string;

    const subscription = await stripe.subscriptions.create({
      customer: custId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { plan, billing, email: email || '' },
    });
    const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret as string | undefined;
    if (!clientSecret) return NextResponse.json({ error: 'No client secret' }, { status: 400 });
    return NextResponse.json({ clientSecret });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

