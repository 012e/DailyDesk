import z from "zod";

export const CardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  order: z.number().int(),
  listId: z.uuidv7(),
  startDate: z.date().nullable(),
  deadline: z.date().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const CreateCardSchema = z.object({
  id: z.uuidv7(),
  name: z.string().nonempty(),
  order: z.number().int(),
  startDate: z.date().optional(),
  deadline: z.date().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const UpdateCardSchema = z.object({
  name: z.string().nonempty().optional(),
  order: z.number().int().optional(),
  startDate: z.date().nullable().optional(),
  deadline: z.date().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});
