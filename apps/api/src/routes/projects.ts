import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

export async function projectRoutes(app: FastifyInstance) {
  // List projects
  app.get('/', {
    schema: {
      summary: 'List projects',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
    preHandler: app.authenticate,
    handler: async (req) => {
      const { page = 1, pageSize = 10 } = req.query as { page?: number; pageSize?: number };
      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        prisma.project.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, description: true, createdAt: true },
        }),
        prisma.project.count(),
      ]);
      return { items, total, page, pageSize };
    },
  });

  // Create project
  app.post('/', {
    schema: {
      summary: 'Create a project',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate, app.authorize],
    handler: async (req, reply) => {
      const Body = z.object({ name: z.string().min(1), description: z.string().optional() });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });
      const created = await prisma.project.create({ data: parsed.data, select: { id: true, name: true, description: true, createdAt: true } });
      return reply.code(201).send(created);
    },
  });

  // Get project
  app.get('/:id', {
    schema: { summary: 'Get a project' },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const item = await prisma.project.findUnique({ where: { id }, include: { contents: { select: { id: true } } } });
      if (!item) return reply.code(404).send({ error: 'Not found' });
      return item;
    },
  });

  // Update project
  app.put('/:id', {
    schema: { summary: 'Update a project', security: [{ bearerAuth: [] }] },
    preHandler: [app.authenticate, app.authorize],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const Body = z.object({ name: z.string().optional(), description: z.string().optional() });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });
      try {
        const updated = await prisma.project.update({ where: { id }, data: parsed.data });
        return updated;
      } catch {
        return reply.code(404).send({ error: 'Not found' });
      }
    },
  });
}
