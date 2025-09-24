import { z } from 'zod';

export const CheckoutBodySchema = z.object({
  plan: z.enum(['essential', 'premium', 'professional']).transform((v) => v as const),
  billing: z.enum(['monthly', 'yearly']).transform((v) => v as const),
  email: z.string().email().optional(),
});

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;

export const PaypalCreateBodySchema = z.object({
  plan: z.enum(['essential', 'premium', 'professional']).transform((v) => v as const),
  billing: z.enum(['monthly', 'yearly']).transform((v) => v as const),
});

export const PaypalCaptureBodySchema = z.object({ orderId: z.string().min(3) });

