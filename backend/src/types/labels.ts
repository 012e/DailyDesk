import z from "zod";

export const LabelSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // Hex color
  userId: z.string(), // Auth0 user ID
});

export const CreateLabelSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const UpdateLabelSchema = z.object({
  name: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
