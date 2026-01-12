import z from "zod";

export const MemberSchema = z.object({
  id: z.uuidv7(),
  boardId: z.uuidv7(),
  userId: z.string(), // Clerk user ID
  name: z.string(),
  email: z.email(),
  avatar: z.string().nullable().optional(),
  role: z.enum(["member", "admin", "viewer"]).default("member"),
  addedAt: z.coerce.date(),
});

export const CreateMemberSchema = z.object({
  id: z.uuidv7(),
  userId: z.string(), // Clerk user ID
  name: z.string(),
  email: z.email(),
  avatar: z.string().nullable().optional(),
  role: z.enum(["member", "admin", "viewer"]).optional().default("member"),
});

export const UpdateMemberSchema = z.object({
  role: z.enum(["member", "admin", "viewer"]).optional(),
});

// Schema for adding member by email (will look up user in Clerk)
export const AddMemberByEmailSchema = z.object({
  email: z.email(),
  role: z.enum(["member", "admin", "viewer"]).optional().default("member"),
});
