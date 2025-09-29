import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const key = process.env['STRIPE_SECRET_KEY'] as string | undefined;
const appUrl = (process.env['APP_URL'] || process.env['NEXTAUTH_URL'] || process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000') as string;
const stripe = key ? new Stripe(key, { apiVersion: '2024-06-20' }) : null;

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  const Body = z.object({
    priceId: z.string().min(1),
    quantity: z.number().int().positive().optional(),
    mode: z.enum(['payment', 'subscription', 'setup']).optional(),
  });
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const { priceId, quantity = 1, mode = 'subscription' } = parsed.data;
  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      automatic_tax: { enabled: true },
    });
    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
