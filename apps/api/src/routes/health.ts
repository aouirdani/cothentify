import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ ok: true, service: 'api', timestamp: Date.now() }));
}

