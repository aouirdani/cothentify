import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { CheckoutBodySchema } from '../../../lib/schemas';

// Body schema moved to lib/schemas

const priceEnvMap: Record<string, { monthly: string | undefined; yearly: string | undefined }> = {
  essential: { monthly: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY, yearly: process.env.STRIPE_PRICE_ESSENTIAL_YEARLY },
  premium: { monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY, yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY },
  professional: { monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY, yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY },
};

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const parsed = CheckoutBodySchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });

  const { plan, billing } = parsed.data;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email || undefined;

  // If Stripe keys or price IDs are not provided, return a mock URL.
  if (!stripeKey || !priceEnvMap[plan]) {
    return NextResponse.json({ url: `/checkout/success?plan=${plan}&billing=${billing}&mock=1` });
  }

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' } as any);
    const priceId = (priceEnvMap[plan] as any)?.[billing];
    if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const idemp = `chk:${plan}:${billing}:${email || 'anon'}`;
    const sess = await stripe.checkout.sessions.create({
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&billing=${billing}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: { plan, billing, email: email || '' },
    }, { idempotencyKey: idemp });
    return NextResponse.json({ url: sess.url }, { status: 200 });
  } catch (e: any) {
    console.error('[api/checkout] error', e);
    return NextResponse.json({ error: 'Stripe error', message: String(e?.message || e) }, { status: 500 });
  }
}
