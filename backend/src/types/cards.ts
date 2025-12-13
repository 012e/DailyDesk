import z from "zod";

export const CardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  order: z.number().int(),
  coverUrl: z.string().url().nullable(),
  coverPublicId: z.string().nullable(),
  coverColor: z.string().nullable(),
  isCover: z.boolean().default(false),
  listId: z.uuidv7(),
});

export const CreateCardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  order: z.number().int(),
});

export const UpdateCardSchema = z.object({
  name: z.string().nonempty().optional(),
  order: z.number().int().optional(),
});
