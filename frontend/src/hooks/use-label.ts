import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { uuidv7 } from "uuidv7";

export interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
}

/**
 * Hook to fetch all labels for a board
 */
export function useLabels(boardId: string) {
  return useQuery({
    queryKey: ["labels", boardId],
    queryFn: async () => {
      const { data, error } = await api.GET("/boards/{boardId}/labels", {
        params: {
          path: {
            boardId,
          },
        },
      });

      if (error) {
        throw new Error("Failed to fetch labels");
      }

      return data as Label[];
    },
    enabled: !!boardId,
  });
}

/**
 * Hook to create a new label
 */
export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      name: string;
      color: string;
    }) => {
      const labelId = uuidv7();

      const { data, error } = await api.POST("/boards/{boardId}/labels", {
        params: {
          path: {
            boardId: params.boardId,
          },
        },
        body: {
          id: labelId,
          name: params.name,
          color: params.color,
        },
      });

      if (error) {
        throw new Error("Failed to create label");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["labels", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to create label:", err);
    },
  });
}

/**
 * Hook to update a label
 */
export function useUpdateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      labelId: string;
      name?: string;
      color?: string;
    }) => {
      const { data, error } = await api.PUT("/boards/{boardId}/labels/{id}", {
        params: {
          path: {
            boardId: params.boardId,
            id: params.labelId,
          },
        },
        body: {
          name: params.name,
          color: params.color,
        },
      });

      if (error) {
        throw new Error("Failed to update label");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["labels", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to update label:", err);
    },
  });
}

/**
 * Hook to delete a label
 */
export function useDeleteLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { boardId: string; labelId: string }) => {
      const { data, error } = await api.DELETE("/boards/{boardId}/labels/{id}", {
        params: {
          path: {
            boardId: params.boardId,
            id: params.labelId,
          },
        },
      });

      if (error) {
        throw new Error("Failed to delete label");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["labels", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to delete label:", err);
    },
  });
}
