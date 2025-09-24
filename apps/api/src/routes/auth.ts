import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';

export async function authRoutes(app: FastifyInstance) {
  // Dev-only endpoint to mint a JWT for testing RBAC.
  app.post('/dev-login', {
    schema: {
      summary: 'Dev login (returns JWT) - not for production',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          role: { type: 'string', enum: Object.values(Role) },
        },
        required: ['email', 'role'],
      },
      response: {
        200: {
          type: 'object',
          properties: { token: { type: 'string' } },
        },
      },
    },
    handler: async (req, reply) => {
      if (process.env['NODE_ENV'] === 'production') {
        return reply.code(404).send({ error: 'Not available in production' });
      }
      const Body = z.object({ email: z.string().email(), role: z.nativeEnum(Role) });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid request' });

      const token = await app.jwt.sign({ sub: parsed.data.email, email: parsed.data.email, role: parsed.data.role }, { expiresIn: '2h' });
      return { token };
    },
  });

  // Simple registration: upsert a user by email (no password storage; placeholder for real auth)
  app.post('/register', {
    schema: {
      summary: 'Register a user (dev placeholder)',
      body: {
        type: 'object',
        properties: { email: { type: 'string' }, name: { type: 'string' } },
        required: ['email'],
      },
    },
    handler: async (req, reply) => {
      const Body = z.object({ email: z.string().email(), name: z.string().optional() });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid request' });
      try {
        const { prisma } = await import('../db');
        const user = await prisma.user.upsert({
          where: { email: parsed.data.email },
          update: { name: parsed.data.name || undefined },
          create: { email: parsed.data.email, name: parsed.data.name },
          select: { id: true, email: true, name: true },
        });
        return { ok: true, user };
      } catch (e: any) {
        return reply.code(500).send({ error: String(e?.message || e) });
      }
    },
  });
}
