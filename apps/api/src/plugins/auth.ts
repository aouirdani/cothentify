import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = (request as any).user as any;
      (request as any).user = { sub: payload?.sub, email: payload?.email, role: payload?.role };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Simple authorization check: ensure a role is present
  app.decorate('authorize', async function (request: FastifyRequest, reply: FastifyReply) {
    const role = (request as any).user?.role as string | undefined;
    if (!role) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  });
});
