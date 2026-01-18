import z from "zod";

export const ChecklistItemMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  initials: z.string().nullable(),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  name: z.string().nonempty(),
  completed: z.boolean(),
  order: z.number().int(),
  cardId: z.string(),
  members: ChecklistItemMemberSchema.array().nullable().optional(),
});

export const CreateChecklistItemSchema = z.object({
  id: z.string(),
  name: z.string().nonempty(),
  completed: z.boolean().optional().default(false),
  order: z.number().int(),
  members: z.array(z.object({ id: z.string() })).optional(),
});

export const UpdateChecklistItemSchema = z.object({
  name: z.string().nonempty().optional(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
  members: z.array(z.object({ id: z.string() })).optional(),
});

