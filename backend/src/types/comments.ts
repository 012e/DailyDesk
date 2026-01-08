import z from "zod";

// User info schema for comments (denormalized from boardMembers or Clerk)
const CommentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().optional(),
  initials: z.string(),
});

// Comment schema - represents a user comment on a card
export const CommentSchema = z.object({
  id: z.uuidv7(),
  cardId: z.uuidv7(),
  userId: z.string(), // Clerk user ID
  content: z.string().nonempty(),
  user: CommentUserSchema, // Denormalized user info for frontend
  createdAt: z.coerce.date(),
});

// Create comment schema - what client sends when creating a comment
export const CreateCommentSchema = z.object({
  content: z.string().nonempty().max(5000), // Max 5000 characters
});

// Type exports
export type Comment = z.infer<typeof CommentSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;
