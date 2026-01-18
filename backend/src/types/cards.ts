import z from "zod";

// Label schema for card labels (subset of full Label)
export const CardLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

// Member schema for card members (output - full details)
export const CardMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable().optional(),
  initials: z.string(),
});

// Member schema for input (only ID needed)
export const CardMemberInputSchema = z.object({
  id: z.string(),
});

// Attachment schema
export const CardAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  publicId: z.string().nullable(),
  type: z.string(),
  size: z.number(),
  uploadedAt: z.coerce.date(),
  uploadedBy: z.string(),
  cardId: z.string(),
});

export const CardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  description: z.string().nullable(),
  order: z.number().int(),
  coverUrl: z.url().nullable(),
  coverPublicId: z.string().nullable(),
  coverColor: z.string().nullable(),
  coverMode: z.string().nullable(),
  listId: z.uuidv7(),
  labels: CardLabelSchema.array().nullable().optional(),
  members: CardMemberSchema.array().nullable().optional(),
  attachments: CardAttachmentSchema.array().nullable().optional(),
  startDate: z.coerce.date().nullable(),
  deadline: z.coerce.date().nullable(),
  dueAt: z.coerce.date().nullable(),
  dueComplete: z.boolean().nullable(),
  reminderMinutes: z.number().nullable(),
  recurrence: z.enum(["never", "daily_weekdays", "weekly", "monthly_date", "monthly_day"]).nullable(),
  recurrenceDay: z.number().int().min(1).max(5).nullable(), // 1st, 2nd, 3rd, 4th, 5th
  recurrenceWeekday: z.number().int().min(0).max(6).nullable(), // 0=Sunday, 6=Saturday
  repeatFrequency: z.enum(["daily", "weekly", "monthly"]).nullable(),
  repeatInterval: z.number().int().min(1).nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  completed: z.boolean().nullable(),
  isTemplate: z.boolean().nullable(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
});

export const CreateCardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  order: z.number().int(),
  listId: z.uuidv7(),
  labels: CardLabelSchema.array().optional(),
  members: CardMemberInputSchema.array().optional(),
  startDate: z.string().datetime().optional(),
  deadline: z.coerce.date().optional(),
  dueAt: z.string().datetime().optional(),
  dueComplete: z.boolean().optional(),
  reminderMinutes: z.number().optional(),
  recurrence: z.enum(["never", "daily_weekdays", "weekly", "monthly_date", "monthly_day"]).optional(),
  recurrenceDay: z.number().int().min(1).max(5).optional(),
  recurrenceWeekday: z.number().int().min(0).max(6).optional(),
  repeatFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  repeatInterval: z.number().int().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coverColor: z.string().optional(),
  coverUrl: z.string().optional(),
  completed: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
});

export const UpdateCardSchema = z.object({
  name: z.string().nonempty().optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
  listId: z.uuidv7().optional(),
  labels: CardLabelSchema.array().nullable().optional(),
  members: CardMemberInputSchema.array().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  dueComplete: z.boolean().nullable().optional(),
  reminderMinutes: z.number().nullable().optional(),
  recurrence: z.enum(["never", "daily_weekdays", "weekly", "monthly_date", "monthly_day"]).nullable().optional(),
  recurrenceDay: z.number().int().min(1).max(5).nullable().optional(),
  recurrenceWeekday: z.number().int().min(0).max(6).nullable().optional(),
  repeatFrequency: z.enum(["daily", "weekly", "monthly"]).nullable().optional(),
  repeatInterval: z.number().int().min(1).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  coverUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  coverMode: z.string().nullable().optional(),
  completed: z.boolean().nullable().optional(),
  isTemplate: z.boolean().nullable().optional(),
});
