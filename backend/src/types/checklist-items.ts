import z from "zod";

export const ChecklistItemSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  completed: z.boolean(),
  order: z.number().int(),
  cardId: z.uuidv7(),
});

export const CreateChecklistItemSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  completed: z.boolean().optional().default(false),
  order: z.number().int(),
});

export const UpdateChecklistItemSchema = z.object({
  name: z.string().nonempty().optional(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
});
