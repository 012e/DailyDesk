import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Card } from "@/types/card";
import { uuidv7 } from "uuidv7";
import api from "@/lib/api";

/**
 * Hook để update card với optimistic updates
 * Sử dụng React Query để manage state và caching
 */
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: Card) => {
      // TODO: Replace với API call thực tế khi backend ready
      // const { data } = await api.PATCH(`/cards/${card.id}`, {
      //   body: card
      // });
      // return data;

      // Mock delay để simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return card;
    },

    // Optimistic update - update UI ngay lập tức
    onMutate: async (updatedCard) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cards"] });

      // Snapshot previous value
      const previousCards = queryClient.getQueryData<Card[]>(["cards"]);

      // Optimistically update to the new value
      if (previousCards) {
        queryClient.setQueryData<Card[]>(
          ["cards"],
          previousCards.map((card) =>
            card.id === updatedCard.id ? updatedCard : card
          )
        );
      }

      // Return context với previous value
      return { previousCards };
    },

    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(["cards"], context.previousCards);
      }
      console.error("Failed to update card:", err);
    },

    // Refetch sau khi mutation succeeds
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

/**
 * Hook để delete card
 */
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      // TODO: Replace với API call thực tế
      // await api.DELETE(`/cards/${cardId}`);

      await new Promise((resolve) => setTimeout(resolve, 300));
      return cardId;
    },

    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: ["cards"] });

      const previousCards = queryClient.getQueryData<Card[]>(["cards"]);

      if (previousCards) {
        queryClient.setQueryData<Card[]>(
          ["cards"],
          previousCards.filter((card) => card.id !== cardId)
        );
      }

      return { previousCards };
    },

    onError: (err, _variables, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(["cards"], context.previousCards);
      }
      console.error("Failed to delete card:", err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
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
    }) => {
      const cardId = uuidv7();
      
      console.log("Creating card with params:", {
        boardId: params.boardId,
        listId: params.listId,
        cardId,
        name: params.name,
        order: params.order ?? 0,
      });

      const { data, error, response } = await api.POST("/boards/{boardId}/cards", {
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
        },
      });

      if (error) {
        console.error("API Error:", error);
        console.error("Response status:", response?.status);
        console.error("Response headers:", response?.headers);
        throw new Error(`Failed to create card: ${JSON.stringify(error)}`);
      }

      return data;
    },

    onSuccess: (_newCard, variables) => {
      // Invalidate board query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to create card:", err);
    },
  });
}
