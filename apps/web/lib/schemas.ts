import { z } from 'zod';

export const CheckoutBodySchema = z.object({
  plan: z.enum(['essential', 'premium', 'professional']),
  billing: z.enum(['monthly', 'yearly']),
  email: z.string().email().optional(),
});

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;

export const PaypalCreateBodySchema = z.object({
  plan: z.enum(['essential', 'premium', 'professional']),
  billing: z.enum(['monthly', 'yearly']),
});

export const PaypalCaptureBodySchema = z.object({ orderId: z.string().min(3) });
