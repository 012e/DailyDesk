import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { uuidv7 } from "uuidv7";

export interface Member {
  id: string;
  boardId: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: "member" | "admin" | "viewer";
  addedAt: Date;
}

/**
 * Hook to fetch all members for a board
 */
export function useMembers(boardId: string) {
  return useQuery({
    queryKey: ["members", boardId],
    queryFn: async () => {
      const { data, error } = await api.GET("/boards/{boardId}/members", {
        params: {
          path: {
            boardId,
          },
        },
      });

      if (error) {
        throw new Error("Failed to fetch members");
      }

      return data as Member[];
    },
    enabled: !!boardId,
  });
}

/**
 * Hook to add a new member to a board
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      userId: string;
      name: string;
      email: string;
      avatar?: string | null;
      role?: "member" | "admin" | "viewer";
    }) => {
      const memberId = uuidv7();

      const { data, error } = await api.POST("/boards/{boardId}/members", {
        params: {
          path: {
            boardId: params.boardId,
          },
        },
        body: {
          id: memberId,
          userId: params.userId,
          name: params.name,
          email: params.email,
          avatar: params.avatar,
          role: params.role,
        },
      });

      if (error) {
        throw new Error("Failed to add member");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to add member:", err);
    },
  });
}

/**
 * Hook to update a member's role
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      memberId: string;
      role: "member" | "admin" | "viewer";
    }) => {
      const { data, error } = await api.PUT("/boards/{boardId}/members/{id}", {
        params: {
          path: {
            boardId: params.boardId,
            id: params.memberId,
          },
        },
        body: {
          role: params.role,
        },
      });

      if (error) {
        throw new Error("Failed to update member");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to update member:", err);
    },
  });
}

/**
 * Hook to remove a member from a board
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { boardId: string; memberId: string }) => {
      const { data, error } = await api.DELETE("/boards/{boardId}/members/{id}", {
        params: {
          path: {
            boardId: params.boardId,
            id: params.memberId,
          },
        },
      });

      if (error) {
        throw new Error("Failed to remove member");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to remove member:", err);
    },
  });
}
