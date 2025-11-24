import { eq } from "@tanstack/db";
import { uuidv7 } from "uuidv7";
import * as z from "zod";
import { useLiveSuspenseQuery } from "@tanstack/react-db";
import api from "@/lib/api";
import { useAtomValue } from "jotai";
import { boardIdAtom } from "@/stores/board";
import { useQueryClient } from "@tanstack/react-query";

export const CreateListSchema = z.object({
  name: z.string().nonempty(),
});

export type CreateListType = z.infer<typeof CreateListSchema>;

export function useListActions() {
  const boardId = useAtomValue(boardIdAtom);
  const queryClient = useQueryClient();

  async function createList(list: CreateListType) {
    if (!boardId) throw new Error("board id is undefined");
    await api.POST("/boards/{boardId}/lists", {
      params: {
        path: {
          boardId: boardId,
        },
      },
      body: {
        id: uuidv7(),
        name: list.name,
        order: 1,
      },
    });

    queryClient.invalidateQueries({
      queryKey: ["board", boardId],
    });
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
