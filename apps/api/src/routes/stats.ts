import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { cacheGet, cacheSet } from '../cache';

export async function statsRoutes(app: FastifyInstance) {
  app.get('/usage', {
    schema: { summary: 'Get usage counts', security: [{ bearerAuth: [] }] },
    preHandler: app.authenticate,
    handler: async (req) => {
      const email = req.user?.email;
      if (!email) return { analysesThisMonth: 0, analysesTotal: 0 };
      const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const key = `usage:${user.id}:${start.toISOString()}`;
      const cached = await cacheGet<{ analysesThisMonth: number; analysesTotal: number }>(key);
      if (cached) return cached;
      const [thisMonth, total] = await Promise.all([
        prisma.aIAnalysis.count({ where: { content: { authorId: user.id }, createdAt: { gte: start } } }),
        prisma.aIAnalysis.count({ where: { content: { authorId: user.id } } }),
      ]);
      const payload = { analysesThisMonth: thisMonth, analysesTotal: total };
      await cacheSet(key, payload, 15);
      return payload;
    },
  });
}
