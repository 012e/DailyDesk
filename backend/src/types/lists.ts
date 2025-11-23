import z from "zod";

export const ListSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  order: z.number().int(),
  boardId: z.uuidv7(),
});

export const CreateListSchema = z.object({
  name: z.string().nonempty(),
  order: z.number().int(),
});

export const UpdateListSchema = z.object({
  name: z.string().nonempty().optional(),
  order: z.number().int().optional(),
});
