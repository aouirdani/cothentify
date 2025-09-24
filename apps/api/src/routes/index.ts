import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { contentRoutes } from './content';
import { authRoutes } from './auth';
import { projectRoutes } from './projects';
import { billingRoutes } from './billing';
import { meRoutes } from './me';
import { stripeRoutes } from './stripe';
import { statsRoutes } from './stats';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ ok: true, service: 'api' }));

  app.register(healthRoutes, { prefix: '/api/v1/health' });
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(contentRoutes, { prefix: '/api/v1/content' });
  app.register(projectRoutes, { prefix: '/api/v1/projects' });
  app.register(billingRoutes, { prefix: '/api/v1/billing' });
  app.register(meRoutes, { prefix: '/api/v1/me' });
  app.register(stripeRoutes, { prefix: '/api/v1/stripe' });
  app.register(statsRoutes, { prefix: '/api/v1/stats' });
}
