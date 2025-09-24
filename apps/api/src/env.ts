import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET 16+ chars required'),
  PORT: z.coerce.number().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  HUGGINGFACE_API_URL: z.string().optional(),
  HUGGINGFACE_API_TOKEN: z.string().optional(),
  ENABLE_HF_DETECTOR: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true'),
  SERVICE_WEBHOOK_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error('❌ Invalid environment configuration:\n' + issues);
  process.exit(1);
}

export const env = parsed.data;
