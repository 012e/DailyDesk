import { uuidv7 } from "uuidv7";
import * as z from "zod";
import api from "@/lib/api";
import { useAtomValue } from "jotai";
import { boardIdAtom } from "@/pages/kanban/atoms";
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

  async function updateList(listId: string, name: string) {
    if (!boardId) throw new Error("board id is undefined");
    await api.PUT("/boards/{boardId}/lists/{id}", {
      params: {
        path: {
          boardId: boardId,
          id: listId,
        },
      },
      body: {
        name: name,
      },
    });

    queryClient.invalidateQueries({
      queryKey: ["board", boardId],
    });
  }

  async function deleteList(listId: string) {
    if (!boardId) throw new Error("board id is undefined");
    await api.DELETE("/boards/{boardId}/lists/{id}", {
      params: {
        path: {
          boardId: boardId,
          id: listId,
        },
      },
    });

    queryClient.invalidateQueries({
      queryKey: ["board", boardId],
    });
  }

  return {
    createList,
    updateList,
    deleteList,
  };
}
