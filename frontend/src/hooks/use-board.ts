import boardCollection from "@/lib/collections/board";
import { createCollection, liveQueryCollectionOptions } from "@tanstack/db";
import * as z from "zod";
import { uuidv7 } from "uuidv7";

export const CreateBoardSchema = z.object({
  name: z.string().nonempty(),
  backgroundColor: board.name,
  backgroundUrl: board.name,
});

export type CreateBoardType = z.infer<typeof CreateBoardSchema>;

export function useBoardActions() {
  function createBoard(board: CreateBoardType) {
    boardCollection.insert({
      id: uuidv7(),
      name: board.name,
      backgroundColor: board.name,
      backgroundUrl: board.name,
    });
  }

  return {
    createBoard,
  };
}

export const boardLiveQuery = createCollection(
  liveQueryCollectionOptions({
    query: (q) =>
      q.from({ boardCollection }).select(({ boardCollection }) => ({
        id: boardCollection.id,
        name: boardCollection.name,
        isBackgroundImage: false,
        background: "#e992ffff",
      })),
    startSync: true,
  }),
);
