import z from "zod";
import { createCollection } from "@tanstack/react-db";
import { localStorageCollectionOptions } from "@tanstack/react-db";

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  backgroundUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
});

const boardCollection = createCollection(
  localStorageCollectionOptions({
    schema: BoardSchema,
    id: "board-collection",
    storageKey: "board-collection",
    getKey: (item) => item.id,
  }),
);

export default boardCollection;
