import type { FastifyInstance } from 'fastify';
import { prisma } from '../db';

export async function meRoutes(app: FastifyInstance) {
  app.get('/', {
    schema: { summary: 'Get current user', security: [{ bearerAuth: [] }] },
    preHandler: app.authenticate as any,
    handler: async (req) => {
      const email = (req.user as any)?.email as string | undefined;
      if (!email) return { ok: false };
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
      });
      const recent = await prisma.billingSubscription.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
        select: { plan: true, status: true, billingCycle: true, currentPeriodEnd: true },
      });
      return { email: user.email, plan: user.plan, subscription: recent };
    },
  });
}
