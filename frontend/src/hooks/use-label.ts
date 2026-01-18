import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import { uuidv7 } from "uuidv7";
import { useMembers } from "@/hooks/use-member";
import { useAuth0 } from "@auth0/auth0-react";

export interface Label {
  id: string;
  name: string;
  color: string;
  userId: string;
}

/**
 * Hook to fetch all labels for a user
 */
export function useLabels(userId: string) {
  return useQuery({
    queryKey: ["labels", userId],
    queryFn: async () => {
      const { data, error } = await api.GET("/users/{userId}/labels", {
        params: {
          path: {
            userId,
          },
        },
      });

      if (error) {
        throw new Error("Failed to fetch labels");
      }

      return data as Label[];
    },
    enabled: !!userId,
  });
}

/**
 * Hook to fetch labels from all board members plus the current user
 * This aggregates labels from all users who are members of a board
 * and always includes the current user's labels (even if not a member)
 */
export function useBoardLabels(boardId: string) {
  const { data: members = [] } = useMembers(boardId);
  const { user } = useAuth0();
  const currentUserId = user?.sub || "";

  // Get unique user IDs: all members + current user (deduplicated)
  const memberUserIds = members.map(m => m.userId);
  const allUserIds = currentUserId && !memberUserIds.includes(currentUserId)
    ? [...memberUserIds, currentUserId]
    : memberUserIds;
  
  // Fetch labels for each user
  const labelQueries = useQueries({
    queries: allUserIds.map(userId => ({
      queryKey: ["labels", userId],
      queryFn: async () => {
        const { data, error } = await api.GET("/users/{userId}/labels", {
          params: {
            path: {
              userId,
            },
          },
        });

        if (error) {
          return [];
        }

        return (data as Label[]) || [];
      },
      enabled: !!userId,
    })),
  });

  // Combine all labels from all users
  const allLabels = labelQueries.reduce<Label[]>((acc, query) => {
    if (query.data) {
      return [...acc, ...query.data];
    }
    return acc;
  }, []);

  const isLoading = labelQueries.some(q => q.isLoading);
  const isError = labelQueries.some(q => q.isError);

  return {
    data: allLabels,
    isLoading,
    isError,
  };
}

/**
 * Hook to create a new label
 */
export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      name: string;
      color: string;
    }) => {
      const labelId = uuidv7();

      const { data, error } = await api.POST("/users/{userId}/labels", {
        params: {
          path: {
            userId: params.userId,
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
      queryClient.invalidateQueries({ queryKey: ["labels", variables.userId] });
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
      userId: string;
      labelId: string;
      name?: string;
      color?: string;
    }) => {
      const { data, error } = await api.PUT("/users/{userId}/labels/{id}", {
        params: {
          path: {
            userId: params.userId,
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
      queryClient.invalidateQueries({ queryKey: ["labels", variables.userId] });
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
    mutationFn: async (params: { userId: string; labelId: string }) => {
      const { data, error } = await api.DELETE("/users/{userId}/labels/{id}", {
        params: {
          path: {
            userId: params.userId,
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
      queryClient.invalidateQueries({ queryKey: ["labels", variables.userId] });
    },

    onError: (err) => {
      console.error("Failed to delete label:", err);
    },
  });
}
