import z from "zod";
import { createCollection } from "@tanstack/react-db";
import { localStorageCollectionOptions } from "@tanstack/react-db";

export const ListSchema = z.object({
  id: z.uuidv7(),
  boardId: z.uuidv7(),
  name: z.string().nonempty(),
});

const listCollection = createCollection(
  localStorageCollectionOptions({
    schema: ListSchema,
    id: "list-collection",
    storageKey: "list-collection",
    getKey: (item) => item.id,
  }),
);

export default listCollection;
