import z from "zod";

// Activity action types - các loại hành động được log
export const ActivityActionType = z.enum([
  "card.created",
  "card.renamed",
  "card.moved",
  "card.archived",
  "card.description.updated",
  "member.added",
  "member.removed",
  "label.added",
  "label.removed",
  "deadline.set",
  "deadline.changed",
  "deadline.removed",
  "checklist.added",
  "checklist.completed",
  "checklist.uncompleted",
  "comment.added",
  "comment.deleted",
  "attachment.added",
  "attachment.removed",
]);

// User info schema for activities
const ActivityUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().optional(),
  initials: z.string(),
});

// Activity schema - represents an activity log entry
export const ActivitySchema = z.object({
  id: z.uuidv7(),
  cardId: z.uuidv7(),
  userId: z.string(), // Clerk user ID of person who performed action
  actionType: ActivityActionType,
  description: z.string().nonempty(), // Human-readable description
  metadata: z.record(z.string(), z.any()).nullable(), // Additional data as JSON
  user: ActivityUserSchema, // Denormalized user info for frontend
  createdAt: z.coerce.date(),
});

// Create activity schema - internal use for logging activities
export const CreateActivitySchema = z.object({
  cardId: z.uuidv7(),
  userId: z.string(),
  actionType: ActivityActionType,
  description: z.string().nonempty(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Type exports
export type Activity = z.infer<typeof ActivitySchema>;
export type CreateActivity = z.infer<typeof CreateActivitySchema>;
export type ActivityActionTypeValue = z.infer<typeof ActivityActionType>;
