import * as z from "zod";
import api, { queryApi } from "@/lib/api";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { uuidv7 } from "uuidv7";
import { useDeleteImage } from "@/hooks/use-image";

export const CreateBoardSchema = z.object({
  name: z.string().nonempty(),
  backgroundColor: z.string().optional(),
  backgroundUrl: z.string().optional(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().nonempty().optional(),
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
export type BoardType = z.infer<typeof BoardSchema>;

export function useCreateBoard() {
  const queryClient = useQueryClient();

  const { mutateAsync } = queryApi.useMutation("post", "/boards", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (err) => {
      console.error("Failed to create board:", err);
    },
  });

  const createBoard = async (board: CreateBoardType): Promise<BoardType> => {
    const newBoard = await mutateAsync({
      body: {
        id: uuidv7(),
        name: board.name,
        backgroundColor: board.backgroundColor,
        backgroundUrl: board.backgroundUrl,
      },
    });

    return {
      id: newBoard.id,
      name: newBoard.name,
      lists: [],
      backgroundUrl: newBoard.backgroundUrl ?? undefined,
      backgroundColor: newBoard.backgroundColor ?? undefined,
    };
  };

  return {
    createBoard,
  };
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  const { deleteImage } = useDeleteImage();

  const { mutateAsync } = queryApi.useMutation("put", "/boards/{id}", {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      if (variables?.params?.path?.id) {
        queryClient.invalidateQueries({ queryKey: ["board", variables.params.path.id] });
      }
    },
    onError: (err) => {
      console.error("Failed to update board:", err);
    },
  });

  const updateBoard = async (id: string, boardData: BoardType) => {
    // validate dữ liệu trước khi gửi
    const parsedData = UpdateBoardSchema.parse(boardData);

    const updatedBoard = await mutateAsync({
      params: { path: { id } },
      body: parsedData,
    });

    if (boardData.backgroundColor) {
      try {
        await deleteImage("board", id);
      } catch (error) {
        throw new Error(`Failed to delete  board image: ${error}`);
      }
    }

    return updatedBoard;
  };

  return {
    updateBoard,
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
  return {
    ownedBoards: data.ownedBoards,
    invitedBoards: data.invitedBoards,
  };
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

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  const { deleteImage } = useDeleteImage();

  const { mutateAsync } = queryApi.useMutation("delete", "/boards/{id}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (err) => {
      console.error("Failed to delete board:", err);
    },
  });

  const deleteBoard = async (id: string, hasImage: boolean = false) => {
    // Delete the board image from Cloudinary if it exists
    if (hasImage) {
      try {
        await deleteImage("board", id);
      } catch (error) {
        console.warn("Failed to delete board image:", error);
        // Continue with board deletion even if image deletion fails
      }
    }

    await mutateAsync({
      params: { path: { id } },
    });

    return true;
  };

  return {
    deleteBoard,
  };
}
