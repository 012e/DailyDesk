import * as z from "zod";
import { uuidv7 } from "uuidv7";
import { createCollection, useLiveSuspenseQuery } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import api from "@/lib/api";

export const CreateBoardSchema = z.object({
  name: z.string().nonempty(),
  backgroundColor: z.string().optional(),
  backgroundUrl: z.string().optional(),
});

export type CreateBoardType = z.infer<typeof CreateBoardSchema>;

export function useBoardCollection() {
  const boardCollection = createCollection(
    queryCollectionOptions({
      queryKey: ["boards"],
      queryFn: async () => {
        const { data, error } = await api.GET("/boards");
        if (error) {
          throw new Error(error);
        }
        return data!;
      },
      queryClient,
      getKey: (item) => item.id,
    }),
  );
  return boardCollection;
}

export function useBoardActions() {
  const boardCollection = useBoardCollection();
  function createBoard(board: CreateBoardType) {
    boardCollection.insert({
      id: uuidv7(),
      name: board.name,
      userId: "",
      // backgroundColor: board.backgroundColor,
      // backgroundUrl: board.backgroundUrl,
    });
  }

  function deleteBoard(id: string) {
    boardCollection.delete(id);
  }

  return {
    createBoard,
    deleteBoard,
  };
}

export function useBoards() {
  const boardCollection = useBoardCollection();
  const { data } = useLiveSuspenseQuery((q) =>
    q.from({ boardCollection }).select(({ boardCollection }) => ({
      id: boardCollection.id,
      name: boardCollection.name,
      // backgroundUrl: boardCollection.backgroundUrl,
      // backgroundColor:
      //   boardCollection.backgroundColor ??
      //   (!boardCollection.backgroundUrl && "#e992ffff"),
    })),
  );
  return data;
}
