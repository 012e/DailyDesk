import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uuidv7 } from "uuidv7";
import api from "@/lib/api";
import { useDeleteImage } from "@/hooks/use-image";

/**
 * Hook để update card với optimistic updates
 * Sử dụng React Query để manage state và caching
 */
export function useUpdateCard() {
  const queryClient = useQueryClient();
  const { deleteImage } = useDeleteImage();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      cardId: string;
      name?: string;
      description?: string | null;
      order?: number;
      listId?: string;
      labels?: Array<{ id: string; name: string; color: string }> | null;
      members?: Array<{
        id: string;
        name: string;
        email: string;
        avatar?: string;
        initials: string;
      }> | null;
      deadline?: Date | null;
      coverColor?: string | null;
      coverUrl?: string | null;
      completed?: boolean | null;
    }) => {
      const { data, error } = await api.PUT("/boards/{boardId}/cards/{id}", {
        params: {
          path: {
            boardId: params.boardId,
            id: params.cardId,
          },
        },
        body: {
          name: params.name,
          description: params.description,
          order: params.order,
          listId: params.listId,
          labels: params.labels,
          members: params.members,
          deadline: params.deadline?.toISOString(),
          coverColor: params.coverColor,
          coverUrl: params.coverUrl,
          completed: params.completed,
        },
      });

      if (error) {
        throw new Error("Failed to update card");
      }

      if (params.coverColor && params.coverUrl) {
        try {
          await deleteImage("card", params.cardId);
        } catch (error) {
          console.error(`Failed to delete card cover: ${error}`);
        }
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to update card:", err);
    },
  });
}

/**
 * Hook để delete card
 */
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { boardId: string; cardId: string }) => {
      const { error } = await api.DELETE("/boards/{boardId}/cards/{id}", {
        params: {
          path: {
            boardId: params.boardId,
            id: params.cardId,
          },
        },
      });

      if (error) {
        throw new Error("Failed to delete card");
      }

      return params.cardId;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to delete card:", err);
    },
  });
}

/**
 * Hook để create card mới
 */
export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      listId: string;
      name: string;
      order?: number;
      description?: string;
      labels?: Array<{ id: string; name: string; color: string }>;
      members?: Array<{
        id: string;
        name: string;
        email: string;
        avatar?: string;
        initials: string;
      }>;
      deadline?: Date;
      startDate?: string;
      dueAt?: string;
      dueComplete?: boolean;
      reminderMinutes?: number | null;
      coverColor?: string;
      coverUrl?: string;
    }) => {
      const cardId = uuidv7();

      const { data, error, response } = await api.POST(
        "/boards/{boardId}/cards",
        {
          params: {
            path: {
              boardId: params.boardId,
            },
          },
          body: {
            id: cardId,
            name: params.name,
            order: params.order ?? 0,
            listId: params.listId,
            description: params.description,
            labels: params.labels,
            members: params.members,
            deadline: params.deadline?.toISOString(),
            startDate: params.startDate,
            dueAt: params.dueAt,
            dueComplete: params.dueComplete,
            reminderMinutes: params.reminderMinutes ?? undefined,
          },
        },
      );

      if (error) {
        console.error("API Error:", error);
        console.error("Response status:", response?.status);
        console.error("Response headers:", response?.headers);
        throw new Error(`Failed to create card: ${JSON.stringify(error)}`);
      }

      return data;
    },

    onSuccess: (_newCard, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to create card:", err);
    },
  });
}
