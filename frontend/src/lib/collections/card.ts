import z from "zod";
import { createCollection } from "@tanstack/react-db";
import { localStorageCollectionOptions } from "@tanstack/react-db";

export const CardSchema = z.object({
  id: z.uuidv7(),
  title: z.string().nonempty(),
  description: z.string().optional(),
  listId: z.uuidv7(),
});

const cardCollection = createCollection(
  localStorageCollectionOptions({
    schema: CardSchema,
    id: "card-collection",
    storageKey: "card-collection",
    getKey: (item) => item.id,
  }),
);

export default cardCollection;
