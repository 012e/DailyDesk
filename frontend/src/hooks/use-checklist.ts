import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ChecklistItem } from "@/types/checklist-items";
import { v7 as uuidv7 } from "uuid";

export function useChecklistItems(boardId: string, cardId: string) {
  return useQuery<ChecklistItem[]>({
    queryKey: ["checklist-items", boardId, cardId],
    queryFn: async () => {
      const { data, error } = await api.GET("/boards/{boardId}/cards/{cardId}/checklist-items", {
        params: { path: { boardId, cardId } },
      });
      if (error) throw error;
      // Ensure the returned data is an array of ChecklistItem
      // If your API returns { items: ChecklistItem[] }, adjust accordingly
      // Here, we assume data is ChecklistItem[] or undefined
      return (data as unknown as ChecklistItem[]) || [];
    },
  });
}

export function useAddChecklistItem(boardId: string, cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ChecklistItem, "id">) => {
      // Ensure id and cardId are uuidv7
      const checklistWithId = { ...item, id: uuidv7(), cardId: typeof item.cardId === 'string' ? item.cardId : uuidv7() };
      const { data, error, response } = await api.POST("/boards/{boardId}/cards/{cardId}/checklist-items", {
        params: { path: { boardId, cardId } },
        body: checklistWithId,
      });
      if (error) {
        // Include server response body when available for easier debugging
        const msg = error?.message || (await response?.text()) || "Unknown error";
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", boardId, cardId] });
    },
  });
}

export function useUpdateChecklistItem(boardId: string, cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { data, error } = await api.PUT("/boards/{boardId}/cards/{cardId}/checklist-items/{id}", {
        params: { path: { boardId, cardId, id: item.id } },
        body: item,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", boardId, cardId] });
    },
  });
}

export function useDeleteChecklistItem(boardId: string, cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE("/boards/{boardId}/cards/{cardId}/checklist-items/{id}", {
        params: { path: { boardId, cardId, id } },
      });
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", boardId, cardId] });
    },
  });
}
