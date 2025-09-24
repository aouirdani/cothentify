import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { sub: string; email?: string; role?: Role };
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as any;
      request.user = { sub: payload.sub, email: payload.email, role: payload.role as Role };
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  app.decorate(
    'authorize',
    function (roles: Role[]) {
      return async function (request: FastifyRequest, reply: FastifyReply) {
        const role = request.user?.role;
        if (!role || !roles.includes(role)) {
          return reply.code(403).send({ error: 'Forbidden' });
        }
      };
    },
  );
});

