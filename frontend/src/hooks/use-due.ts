import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { RepeatFrequency } from "@/types/card";

export function useUpdateDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      cardId: string;
      startDate?: string | null;
      dueAt?: string | null;
      dueComplete?: boolean;
      reminderMinutes?: number | null;
      repeatFrequency?: RepeatFrequency | null;
      repeatInterval?: number | null;
    }) => {
      const { data, error } = await api.PATCH("/boards/{boardId}/cards/{cardId}/due", {
        params: {
          path: {
            boardId: params.boardId,
            cardId: params.cardId,
          },
        },
        body: {
          startDate: params.startDate,
          dueAt: params.dueAt,
          dueComplete: params.dueComplete,
          reminderMinutes: params.reminderMinutes?.toString() as "5" | "10" | "15" | "30" | "60" | "120" | "1440" | undefined,
          repeatFrequency: params.repeatFrequency,
          repeatInterval: params.repeatInterval,
        },
      });

      if (error) {
        throw new Error("Failed to update dates");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to update dates:", err);
    },
  });
}

export function useClearDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      cardId: string;
    }) => {
      const { data, error } = await api.DELETE("/boards/{boardId}/cards/{cardId}/due", {
        params: {
          path: {
            boardId: params.boardId,
            cardId: params.cardId,
          },
        },
      });

      if (error) {
        throw new Error("Failed to clear due date");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to clear due date:", err);
    },
  });
}
