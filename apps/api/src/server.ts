import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import rawBody from 'fastify-raw-body';
import compress from '@fastify/compress';
import Stripe from 'stripe';
import { z } from 'zod';
import type { FastifyError } from 'fastify';
import { env } from './env';
import { registerRoutes } from './routes';
import authPlugin from './plugins/auth';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet);
  await app.register(compress, { global: true, encodings: ['br', 'gzip'] });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(rawBody, { field: 'rawBody', global: false, encoding: 'utf8', runFirst: true });

  // Stripe Webhook (raw body is required)
  app.post('/api/stripe/webhook', { config: { rawBody: true } }, async (req, reply) => {
    const sig = (req.headers['stripe-signature'] as string) || '';
    const key = process.env['STRIPE_SECRET_KEY'] || '';
    const wh = process.env['STRIPE_WEBHOOK_SECRET'] || '';
    if (!key || !wh) return reply.code(400).send({ error: 'Stripe not configured' });
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
    try {
      const raw = req.rawBody ?? '';
      stripe.webhooks.constructEvent(raw, sig, wh);
      // TODO: handle event types
      return reply.send({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return reply.status(400).send({ error: `Webhook Error: ${message}` });
    }
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Cothentify API',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:' + env.PORT }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: '/docs' });

  await app.register(authPlugin);
  await registerRoutes(app);

  // PayPal minimal endpoints
  app.post('/api/paypal/order', async (req, reply) => {
    const { createOrder } = await import('./paypal');
    const Body = z
      .object({ total: z.union([z.string(), z.number()]).optional(), currency: z.string().length(3).optional() })
      .optional();
    const parsed = Body.safeParse(req.body);
    const data = parsed.success && parsed.data ? parsed.data : {};
    const total = data.total !== undefined ? String(data.total) : '9.99';
    const currency = data.currency ?? 'EUR';
    try {
      const order = await createOrder(total, currency);
      return reply.send(order);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'paypal order failed';
      return reply.code(400).send({ error: message });
    }
  });

  app.post('/api/paypal/capture', async (req, reply) => {
    const { captureOrder } = await import('./paypal');
    const Body = z.object({ orderId: z.string().min(3) });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }
    try {
      const out = await captureOrder(parsed.data.orderId);
      return reply.send(out);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'paypal capture failed';
      return reply.code(400).send({ error: message });
    }
  });

  app.setErrorHandler((error: FastifyError, _req, reply) => {
    app.log.error(error);
    const status = error.statusCode ?? 500;
    reply.code(status).send({ error: error.message || 'Internal Server Error' });
  });

  return app;
}
