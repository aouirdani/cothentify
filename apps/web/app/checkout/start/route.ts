import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const plan = (url.searchParams.get('plan') || '').toLowerCase();
  const billing = (url.searchParams.get('billing') || 'monthly').toLowerCase();
  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  const email = (await getServerSession(authOptions))?.user?.email || undefined;

  const priceEnvMap: Record<string, { monthly?: string; yearly?: string }> = {
    essential: { monthly: process.env["STRIPE_PRICE_ESSENTIAL_MONTHLY"], yearly: process.env["STRIPE_PRICE_ESSENTIAL_YEARLY"] },
    premium: { monthly: process.env["STRIPE_PRICE_PREMIUM_MONTHLY"], yearly: process.env["STRIPE_PRICE_PREMIUM_YEARLY"] },
    professional: { monthly: process.env["STRIPE_PRICE_PROFESSIONAL_MONTHLY"], yearly: process.env["STRIPE_PRICE_PROFESSIONAL_YEARLY"] },
  };

  if (!stripeKey || !priceEnvMap[plan]) {
    return NextResponse.redirect(new URL(`/checkout/success?plan=${plan}&billing=${billing}&mock=1`, url.origin));
  }

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' } as any);
    const priceId = (priceEnvMap[plan] as any)?.[billing];
    if (!priceId) return NextResponse.redirect(new URL(`/checkout/cancel?reason=price_not_configured`, url.origin));
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { plan, billing, email: email || '' },
      success_url: `${process.env["NEXTAUTH_URL"] || url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&billing=${billing}`,
      cancel_url: `${process.env["NEXTAUTH_URL"] || url.origin}/checkout/cancel`,
    });
    return NextResponse.redirect(session.url as string);
  } catch (e) {
    return NextResponse.redirect(new URL(`/checkout/cancel?reason=error`, url.origin));
  }
}
