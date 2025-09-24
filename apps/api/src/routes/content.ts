import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { analyzeContent } from '../services/detection/ensemble';
import { prisma } from '../db';
import { cacheGet, cacheSet } from '../cache';
import { ContentStatus } from '@prisma/client';

const AnalyzeBody = z.object({
  content: z.string().min(1),
  options: z
    .object({
      detailed_analysis: z.boolean().default(true),
      batch_processing: z.boolean().default(false),
      language: z.string().default('en'),
    })
    .default({ detailed_analysis: true, batch_processing: false, language: 'en' }),
});

export async function contentRoutes(app: FastifyInstance) {
  // List content pieces (paginated)
  app.get('/', {
    schema: {
      summary: 'List content pieces',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
    preHandler: app.authenticate as any,
    handler: async (req) => {
      const { page = 1, pageSize = 10 } = req.query as { page?: number; pageSize?: number };
      const skip = (page - 1) * pageSize;
      const cacheKey = `content:list:${page}:${pageSize}`;
      const cached = await cacheGet<{ items: any[]; total: number; page: number; pageSize: number }>(cacheKey);
      if (cached) return cached;
      const [items, total] = await Promise.all([
        prisma.contentPiece.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, language: true, status: true, createdAt: true },
        }),
        prisma.contentPiece.count(),
      ]);
      const payload = { items, total, page, pageSize };
      await cacheSet(cacheKey, payload, 30);
      return payload;
    },
  });

  // Create content piece
  app.post('/', {
    schema: {
      summary: 'Create a content piece',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate as any, app.authorize as any],
    handler: async (req, reply) => {
      const Body = z.object({ title: z.string().min(1), body: z.string().min(1), language: z.string().default('en') });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });
      }
      // Attach author when available
      let authorId: string | undefined = undefined;
      const email = (req.user as any)?.email as string | undefined;
      if (email) {
        const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
        authorId = user.id;
      }
      const created = await prisma.contentPiece.create({
        data: { title: parsed.data.title, body: parsed.data.body, language: parsed.data.language, status: ContentStatus.DRAFT, authorId },
        select: { id: true, title: true, language: true, status: true, createdAt: true },
      });
      return reply.code(201).send(created);
    },
  });

  // Get by id
  app.get('/:id', {
    schema: { summary: 'Get a content piece' },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const item = await prisma.contentPiece.findUnique({
        where: { id },
        include: { analyses: { orderBy: { createdAt: 'desc' }, take: 5 } },
      });
      if (!item) return reply.code(404).send({ error: 'Not found' });
      return item;
    },
  });

  // Update
  app.put('/:id', {
    schema: { summary: 'Update a content piece' },
    preHandler: [app.authenticate as any, app.authorize as any],
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const Body = z.object({ title: z.string().optional(), body: z.string().optional(), language: z.string().optional(), status: z.nativeEnum(ContentStatus).optional() });
      const parsed = Body.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });
      try {
        const updated = await prisma.contentPiece.update({ where: { id }, data: parsed.data });
        return updated;
      } catch {
        return reply.code(404).send({ error: 'Not found' });
      }
    },
  });

  app.post('/analyze', {
    schema: {
      summary: 'Analyze content for AI-generation likelihood',
      body: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              detailed_analysis: { type: 'boolean' },
              batch_processing: { type: 'boolean' },
              language: { type: 'string' },
            },
          },
        },
        required: ['content'],
      },
    },
    handler: async (req, reply) => {
      const parsed = AnalyzeBody.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });
      }

      const start = performance.now();
      const result = await analyzeContent(parsed.data.content, parsed.data.options);
      const processing_time = Number(((performance.now() - start) / 1000).toFixed(3));

      return reply.send({ ...result, processing_time });
    },
  });

  // Enqueue analysis for a stored content piece
  app.post('/:id/analyze', {
    schema: { summary: 'Enqueue analysis for existing content' },
    preHandler: app.authenticate as any,
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const piece = await prisma.contentPiece.findUnique({ where: { id }, select: { id: true } });
      if (!piece) return reply.code(404).send({ error: 'Not found' });

      // Lazy import to avoid circular deps
      const { enqueueAnalysisJob } = await import('../workers/enqueue');
      const job = await enqueueAnalysisJob(id);
      return reply.send({ queued: true, jobId: job.id });
    },
  });
}
