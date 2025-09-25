import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const key = process.env['STRIPE_SECRET_KEY'] as string | undefined;
const appUrl = (process.env['APP_URL'] || process.env['NEXTAUTH_URL'] || process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000') as string;
const stripe = key ? new Stripe(key, { apiVersion: '2024-06-20' } as any) : null;

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const priceId = body?.priceId as string | undefined;
  const quantity = Number(body?.quantity || 1);
  const mode = (body?.mode as 'payment' | 'subscription' | 'setup') || 'subscription';
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      automatic_tax: { enabled: true },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Stripe error' }, { status: 400 });
  }
}

