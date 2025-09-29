import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = await request.jwtVerify<{ sub: string; email?: string; role?: string }>();
      request.user = { sub: payload.sub, email: payload.email, role: payload.role };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Simple authorization check: ensure a role is present
  app.decorate('authorize', async function (request: FastifyRequest, reply: FastifyReply) {
    const role = request.user?.role;
    if (!role) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  });
});
