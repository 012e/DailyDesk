import z from "zod";

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  userId: z.string().nonempty(),
});

export const CreateBoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().nonempty(),
});
