import { eq } from "@tanstack/db";
import { uuidv7 } from "uuidv7";
import * as z from "zod";
import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { boardCollection } from "./use-board";

export const CreateListSchema = z.object({
  name: z.string().nonempty(),
});

export type CreateListType = z.infer<typeof CreateListSchema>;

export function useListActions(boardId: string) {
  function createList(list: CreateListType) {
    boardCollection.update(
      boardId,
      {
        metadata: {
          type: "create-list",
        },
      },
      (draft) => {
        console.log("fuckkkkk");
        draft.lists = [
          ...draft.lists,
          {
            id: uuidv7(),
            name: list.name,
            boardId: boardId,
            cards: [],
          },
        ];
      },
    );
  }

  return {
    createList,
  };
}

export function useLists({ boardId }: { boardId: string }) {
  const listCollection = useLiveSuspenseQuery(
    (q) =>
      q
        .from({ board: boardCollection })
        .where(({ board }) => eq(board.id, boardId))
        .findOne(),
    [boardId],
  );
  return listCollection.data!.lists;
}
