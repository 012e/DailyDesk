import z from "zod";
import { ListSchema } from "./lists";
import { CardSchema } from "./cards";

// Hex color validation regex
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  userId: z.string().nonempty(),
  backgroundUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundPublicId: z.string().optional(),
});

// Schema for list with nested cards
export const ListWithCardsSchema = ListSchema.extend({
  cards: z.array(CardSchema),
});

// Schema for board with nested lists and cards
export const BoardWithListsAndCardsSchema = BoardSchema.extend({
  lists: z.array(ListWithCardsSchema),
});

// Schema for invited board with role info
export const InvitedBoardSchema = BoardWithListsAndCardsSchema.extend({
  role: z.enum(["admin", "member", "viewer"]),
});

// Schema for grouped boards response (owned vs invited)
export const GroupedBoardsResponseSchema = z.object({
  ownedBoards: z.array(BoardWithListsAndCardsSchema),
  invitedBoards: z.array(InvitedBoardSchema),
});

export const CreateBoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  backgroundUrl: z.string().optional(),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, "Must be a valid hex color code (e.g., #FF5733)")
    .optional(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().nonempty().optional(),
  backgroundUrl: z.string().nullable().optional(),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, "Must be a valid hex color code (e.g., #FF5733)")
    .nullable()
    .optional(),
});

