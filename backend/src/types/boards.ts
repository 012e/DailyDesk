import z from "zod";
import { ListSchema } from "./lists";
import { CardSchema } from "./cards";

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  userId: z.string().nonempty(),
});

// Schema for list with nested cards
export const ListWithCardsSchema = ListSchema.extend({
  cards: z.array(CardSchema),
});

// Schema for board with nested lists and cards
export const BoardWithListsAndCardsSchema = BoardSchema.extend({
  lists: z.array(ListWithCardsSchema),
});

export const CreateBoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().nonempty(),
});
