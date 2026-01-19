import z from "zod";

export const MemberSchema = z.object({
  id: z.uuidv7(),
  boardId: z.uuidv7(),
  userId: z.string(), // Clerk user ID
  name: z.string(),
  email: z.email(),
  avatar: z.string().nullable().optional(),
  timezone: z.string().optional().nullable(),
  role: z.enum(["member", "admin"]).default("member"),
  addedAt: z.coerce.date(),
});

export const CreateMemberSchema = z.object({
  id: z.uuidv7(),
  userId: z.string(), // Clerk user ID
  name: z.string(),
  email: z.email(),
  avatar: z.string().nullable().optional(),
  role: z.enum(["member", "admin"]).optional().default("member"),
});

export const UpdateMemberSchema = z.object({
  role: z.enum(["member", "admin"]).optional(),
});

// Schema for adding member by email (will look up user in Clerk)
export const AddMemberByEmailSchema = z.object({
  email: z.email(),
  role: z.enum(["member", "admin"]).optional().default("member"),
});

// Schema for adding member by userId (will fetch from Auth0 if not exists)
export const AddMemberByUserIdSchema = z.object({
  userId: z.string().describe("Auth0 user ID (e.g., auth0|123456)"),
  role: z.enum(["member", "admin"]).optional().default("member"),
});
