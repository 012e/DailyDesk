import * as z from "zod";
import { uuidv7 } from "uuidv7";
import { createCollection, eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import api from "@/lib/api";
import { MessageSquareTextIcon } from "lucide-react";

export const CreateBoardSchema = z.object({
  name: z.string().nonempty(),
  backgroundColor: z.string().optional(),
  backgroundUrl: z.string().optional(),
});

export type CreateBoardType = z.infer<typeof CreateBoardSchema>;
export const CardSchema = z.object({
  id: z.uuidv7(),
  title: z.string().nonempty(),
  description: z.string().optional(),
  listId: z.uuidv7(),
});

export const ListSchema = z.object({
  id: z.uuidv7(),
  boardId: z.uuidv7(),
  name: z.string().nonempty(),
  cards: CardSchema.array(),
});

export type ListSchemaType = z.infer<typeof ListSchema>;

export const BoardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  backgroundUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  lists: ListSchema.array(),
});

export const boardCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["boards"],
    schema: BoardSchema,
    syncMode: "on-demand",
    startSync: true,
    queryFn: async () => {
      const { data, error } = await api.GET("/boards");
      if (error) {
        throw new Error(error);
      }
      return data;
    },
    queryClient,
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      return { refetch: false };
    },
    onInsert: async ({ transaction }) => {
      const newItem = transaction.mutations
        .map((m) => m.modified)
        .map((e) =>
          api.POST("/boards", {
            body: {
              id: e.id,
              name: e.name,
            },
          }),
        );
      Promise.all(newItem);
    },
  }),
);

export function useBoardActions() {
  function createBoard(board: CreateBoardType) {
    boardCollection.insert(
      {
        id: uuidv7(),
        name: board.name,
        lists: [],
      },
      {
        metadata: {
          type: "create-board",
        },
      },
    );
  }

  function deleteBoard(id: string) {
    boardCollection.delete(id, {
      metadata: {
        type: "delete-board",
      },
    });
  }

  return {
    createBoard,
    deleteBoard,
  };
}

export function useBoards() {
  const { data } = useLiveSuspenseQuery((q) =>
    q
      .from({ boardCollection })
      .select(({ boardCollection }) => ({
        id: boardCollection.id,
        name: boardCollection.name,
        lists: boardCollection.lists,

        // backgroundUrl: boardCollection.backgroundUrl,
        // backgroundColor:
        //   boardCollection.backgroundColor ??
        //   (!boardCollection.backgroundUrl && "#e992ffff"),
      }))
      .orderBy((e) => e.boardCollection.id, "desc"),
  );

  return data;
}

export function useBoard({ boardId }: { boardId: string }) {
  const { data } = useLiveSuspenseQuery(
    (q) =>
      q
        .from({ boardCollection })
        .where(({ boardCollection }) => eq(boardCollection.id, boardId))
        .select(({ boardCollection: board }) => ({
          id: board.id,
          lists: board.lists,
          name: board.name,
        }))
        .findOne(),
    [boardId],
  );
  console.log("data", data);
  return data!;
}
