import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { upsertSubscriptionStatus } from '../repos/subscriptions';
import { env } from '../env';

const Body = z.object({ plan: z.enum(['FREEMIUM', 'ESSENTIAL', 'PREMIUM', 'PROFESSIONAL']) });

export async function billingRoutes(app: FastifyInstance) {
  // Activate or change current user's plan
  app.post('/activate', {
    schema: {
      summary: 'Activate or change the current user plan',
      security: [{ bearerAuth: [] }],
    },
    preHandler: app.authenticate as any,
    handler: async (req, reply) => {
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
      const email = (req.user as any)?.email as string | undefined;
      if (!email) return reply.code(400).send({ error: 'Missing user email' });
      const user = await prisma.user.upsert({
        where: { email },
        update: { plan: parsed.data.plan as any },
        create: { email, plan: parsed.data.plan as any },
      });
      return { ok: true, plan: user.plan };
    },
  });

  // Webhook activation via service token (no user JWT)
  app.post('/webhook-activate', {
    schema: { summary: 'Activate a plan via webhook token' },
    handler: async (req, reply) => {
      const token = req.headers['x-auth-token'] as string | undefined;
      if (!env.SERVICE_WEBHOOK_TOKEN || token !== env.SERVICE_WEBHOOK_TOKEN) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const Body2 = z.object({ email: z.string().email(), plan: z.enum(['FREEMIUM', 'ESSENTIAL', 'PREMIUM', 'PROFESSIONAL']) });
      const parsed = Body2.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
      const user = await prisma.user.upsert({
        where: { email: parsed.data.email },
        update: { plan: parsed.data.plan as any },
        create: { email: parsed.data.email, plan: parsed.data.plan as any },
      });
      return { ok: true, plan: user.plan };
    }
  });

  // Upsert subscription/order status via service token (used by Stripe/PayPal webhooks from web app)
  app.post('/status', {
    schema: { summary: 'Upsert subscription status via service token' },
    handler: async (req, reply) => {
      const token = req.headers['x-auth-token'] as string | undefined;
      if (!env.SERVICE_WEBHOOK_TOKEN || token !== env.SERVICE_WEBHOOK_TOKEN) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const Body = z.object({
        provider: z.enum(['stripe', 'paypal']),
        externalId: z.string().min(2),
        status: z.enum(['incomplete', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'paused']),
        email: z.string().email().optional(),
        plan: z.enum(['FREEMIUM', 'ESSENTIAL', 'PREMIUM', 'PROFESSIONAL']).optional(),
        billing: z.enum(['MONTHLY', 'YEARLY']).optional(),
        meta: z.record(z.any()).optional(),
      });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });

      const { provider, externalId, status, email, plan, billing, meta } = parsed.data as any;
      try {
        await upsertSubscriptionStatus(prisma, {
          provider,
          externalId,
          status,
          email,
          plan,
          billing,
          meta,
        });

        return { ok: true };
      } catch (e) {
        app.log.error(e);
        return reply.code(500).send({ error: 'DB error' });
      }
    },
  });
}
