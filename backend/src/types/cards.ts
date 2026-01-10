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
  listId: z.uuidv7(),
  labels: CardLabelSchema.array().nullable(),
  members: CardMemberSchema.array().nullable(),
  startDate: z.coerce.date().nullable(),
  deadline: z.coerce.date().nullable(),
  recurrence: z.enum(["never", "daily_weekdays", "weekly", "monthly_date", "monthly_day"]).nullable(),
  recurrenceDay: z.number().int().min(1).max(5).nullable(), // 1st, 2nd, 3rd, 4th, 5th
  recurrenceWeekday: z.number().int().min(0).max(6).nullable(), // 0=Sunday, 6=Saturday
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  completed: z.boolean().nullable(),
});

export const CreateCardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  order: z.number().int(),
  labels: CardLabelSchema.array().optional(),
  members: CardMemberSchema.array().optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  recurrence: z.enum(["never", "daily_weekdays", "weekly", "monthly_date", "monthly_day"]).optional(),
  recurrenceDay: z.number().int().min(1).max(5).optional(),
  recurrenceWeekday: z.number().int().min(0).max(6).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coverColor: z.string().optional(),
  completed: z.boolean().optional(),
});

export const UpdateCardSchema = z.object({
  name: z.string().nonempty().optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
  labels: CardLabelSchema.array().nullable().optional(),
  members: CardMemberSchema.array().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  recurrence: z.enum(["never", "daily_weekdays", "weekly", "monthly_date", "monthly_day"]).nullable().optional(),
  recurrenceDay: z.number().int().min(1).max(5).nullable().optional(),
  recurrenceWeekday: z.number().int().min(0).max(6).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  coverUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  completed: z.boolean().nullable().optional(),
});
