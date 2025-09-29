import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PlanTier, BillingCycle } from '@prisma/client';
import { prisma } from '../db';
import { upsertSubscriptionStatus } from '../repos/subscriptions';
import { env } from '../env';

const PlanBody = z.object({ plan: z.nativeEnum(PlanTier) });

export async function billingRoutes(app: FastifyInstance) {
  // Activate or change current user's plan
  app.post('/activate', {
    schema: {
      summary: 'Activate or change the current user plan',
      security: [{ bearerAuth: [] }],
    },
    preHandler: app.authenticate,
    handler: async (req, reply) => {
      const parsed = PlanBody.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
      const email = req.user?.email;
      if (!email) return reply.code(400).send({ error: 'Missing user email' });
      const user = await prisma.user.upsert({
        where: { email },
        update: { plan: parsed.data.plan },
        create: { email, plan: parsed.data.plan },
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
      const WebhookBody = z.object({ email: z.string().email(), plan: z.nativeEnum(PlanTier) });
      const parsed = WebhookBody.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
      const user = await prisma.user.upsert({
        where: { email: parsed.data.email },
        update: { plan: parsed.data.plan },
        create: { email: parsed.data.email, plan: parsed.data.plan },
      });
      return { ok: true, plan: user.plan };
    },
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
        plan: z.nativeEnum(PlanTier).optional(),
        billing: z.nativeEnum(BillingCycle).optional(),
        meta: z.record(z.any()).optional(),
      });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });

      const { provider, externalId, status, email, plan, billing, meta } = parsed.data;
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
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ error: 'DB error' });
      }
    },
  });
}
