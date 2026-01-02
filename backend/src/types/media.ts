import * as z from "zod";

export const SaveImageBodySchema = z.object({
  secure_url: z.string().url(),
  public_id: z.string(),
});

export type SaveImageBodyType = z.infer<typeof SaveImageBodySchema>;

export const SaveImageResponseSchema = z.object({
  secure_url: z.string().url().optional(),
  public_id: z.string().optional(),
});

export type SaveImageResponseType = z.infer<typeof SaveImageResponseSchema>;
