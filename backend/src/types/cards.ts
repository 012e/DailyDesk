import z from "zod";

// Label schema for card labels (subset of full Label)
const CardLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

// Member schema for card members
const CardMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().optional(),
  initials: z.string(),
});

export const CardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  description: z.string().nullable(),
  order: z.number().int(),
  coverUrl: z.string().url().nullable(),
  coverPublicId: z.string().nullable(),
  coverColor: z.string().nullable(),
  coverMode: z.string().nullable(),
  listId: z.uuidv7(),
  labels: CardLabelSchema.array().nullable(),
  members: CardMemberSchema.array().nullable(),
  startDate: z.coerce.date().nullable(),
  deadline: z.coerce.date().nullable(),
  dueAt: z.coerce.date().nullable(),
  dueComplete: z.boolean().nullable(),
  reminderMinutes: z.number().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  completed: z.boolean().nullable(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
});

export const CreateCardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  order: z.number().int(),
  labels: CardLabelSchema.array().optional(),
  members: CardMemberSchema.array().optional(),
  startDate: z.string().datetime().optional(),
  deadline: z.coerce.date().optional(),
  dueAt: z.string().datetime().optional(),
  dueComplete: z.boolean().optional(),
  reminderMinutes: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coverColor: z.string().optional(),
  completed: z.boolean().optional(),
  coverUrl: z.string().optional(),
});

export const UpdateCardSchema = z.object({
  name: z.string().nonempty().optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
  labels: CardLabelSchema.array().nullable().optional(),
  members: CardMemberSchema.array().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  dueComplete: z.boolean().nullable().optional(),
  reminderMinutes: z.number().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  coverUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  coverMode: z.string().nullable().optional(),
  completed: z.boolean().nullable().optional(),
});
