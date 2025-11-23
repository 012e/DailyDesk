import {
  createCollection,
  liveQueryCollectionOptions,
  localStorageCollectionOptions,
} from "@tanstack/db";
import listCollection from "@/lib/collections/list";
import { uuidv7 } from "uuidv7";
import * as z from "zod";

export const CreateListSchema = z.object({
  name: z.string().nonempty(),
});

export type CreateListType = z.infer<typeof CreateListSchema>;

export const ListSchema = z.object({
  id: z.uuidv7(),
  boardId: z.uuidv7(),
  name: z.string().nonempty(),
});

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

export function useLists({ boardId }: { boardId: string }) {
  const listCollection = createCollection(
    localStorageCollectionOptions({
      schema: ListSchema,
      id: "list-collection",
      storageKey: "list-collection",
      getKey: (item) => item.id,
    }),
  );
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
