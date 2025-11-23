import boardCollection from "@/lib/collections/board";
import * as z from "zod";
import { uuidv7 } from "uuidv7";
import { useLiveSuspenseQuery } from "@tanstack/react-db";

export const CreateBoardSchema = z.object({
  name: z.string().nonempty(),
  backgroundColor: z.string().optional(),
  backgroundUrl: z.string().optional(),
});

export type CreateBoardType = z.infer<typeof CreateBoardSchema>;

export function useBoardActions() {
  function createBoard(board: CreateBoardType) {
    boardCollection.insert({
      id: uuidv7(),
      name: board.name,
      backgroundColor: board.backgroundColor,
      backgroundUrl: board.backgroundUrl,
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

export default function useBoards() {
  const { data } = useLiveSuspenseQuery((q) =>
    q.from({ boardCollection }).select(({ boardCollection }) => ({
      id: boardCollection.id,
      name: boardCollection.name,
      backgroundUrl: boardCollection.backgroundUrl,
      backgroundColor:
        boardCollection.backgroundColor ??
        (!boardCollection.backgroundUrl && "#e992ffff"),
    })),
  );
  return data;
}
