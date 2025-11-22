import { createCollection, liveQueryCollectionOptions } from "@tanstack/db";
import listCollection from "@/lib/collections/list";
import { uuidv7 } from "uuidv7";
import * as z from "zod";

export const CreateListSchema = z.object({
  name: z.string().nonempty(),
});

export type CreateListType = z.infer<typeof CreateListSchema>;

export function useListActions(boardId: string) {
  function createList(list: CreateListType) {
    listCollection.insert({
      id: uuidv7(),
      boardId,
      name: list.name,
      cards: [],
    });
  }
  return {
    createList,
  };
}

export const listLiveQuery = createCollection(
  liveQueryCollectionOptions({
    query: (q) =>
      q.from({ list: listCollection }).select(({ list }) => ({
        id: list.id,
        name: list.name,
        cards: list.cards,
      })),
    startSync: true,
  }),
);
