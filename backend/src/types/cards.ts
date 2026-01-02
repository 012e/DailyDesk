import z from "zod";

export const CardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  order: z.number().int(),
  coverUrl: z.string().url().nullable(),
  coverPublicId: z.string().nullable(),
  coverColor: z.string().nullable(),
  listId: z.uuidv7(),
  startDate: z.coerce.date().nullable(),
  deadline: z.coerce.date().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const CreateCardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  order: z.number().int(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const UpdateCardSchema = z.object({
  name: z.string().nonempty().optional(),
  order: z.number().int().optional(),
  startDate: z.coerce.date().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});
