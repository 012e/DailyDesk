import * as z from "zod";
import api, { queryApi } from "@/lib/api";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { uuidv7 } from "uuidv7";

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

export function useCreateboard() {
  const { mutate } = queryApi.useMutation("post", "/boards", {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["boards"],
      }),
  });
  const queryClient = useQueryClient();

  function createBoard(board: CreateBoardType) {
    mutate({
      body: {
        id: uuidv7(),
        name: board.name,
        backgroundColor: board.backgroundColor,
        backgroundUrl: board.backgroundUrl,
      },
    });
  }

  return {
    createBoard,
  };
}

export function useBoards() {
  const { data } = useSuspenseQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const { data, error } = await api.GET("/boards");
      if (error) {
        throw new Error(error);
      }
      return data!;
    },
  });
  return data;
}

export function useBoard({ boardId }: { boardId: string }) {
  const board = useSuspenseQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const result = await api.GET("/boards/{id}", {
        params: {
          path: {
            id: boardId,
          },
        },
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data!;
    },
  });
  return board.data;
}
