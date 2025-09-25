import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import rawBody from 'fastify-raw-body';
import compress from '@fastify/compress';
import { env } from './env';
import { registerRoutes } from './routes';
import authPlugin from './plugins/auth';
import Stripe from 'stripe';

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
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' } as any);
    try {
      const event = stripe.webhooks.constructEvent((req as any).rawBody, sig, wh);
      // TODO: handle event types
      return reply.send({ received: true });
    } catch (err: any) {
      return reply.status(400).send({ error: `Webhook Error: ${err?.message || err}` });
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
    const { createOrder, captureOrder } = await import('./paypal');
    const { total, currency } = (req.body || {}) as any;
    try {
      const order = await createOrder(String(total ?? '9.99'), currency ?? 'EUR');
      return reply.send(order);
    } catch (e: any) {
      return reply.code(400).send({ error: e?.message || 'paypal order failed' });
    }
  });

  app.post('/api/paypal/capture', async (req, reply) => {
    const { captureOrder } = await import('./paypal');
    const { orderId } = (req.body || {}) as any;
    try {
      const out = await captureOrder(orderId);
      return reply.send(out);
    } catch (e: any) {
      return reply.code(400).send({ error: e?.message || 'paypal capture failed' });
    }
  });

  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);
    const status = (error as any).statusCode || 500;
    reply.code(status).send({ error: error.message || 'Internal Server Error' });
  });

  return app;
}
