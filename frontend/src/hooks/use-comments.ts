import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Comment, ActivityLog } from "@/types/card";

/**
 * Hook để lấy timeline (comments + activities) cho một card
 */
export function useCardTimeline(boardId: string, cardId: string) {
  return useQuery({
    queryKey: ["card-timeline", boardId, cardId],
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/boards/{boardId}/cards/{cardId}/timeline",
        {
          params: {
            path: {
              boardId,
              cardId,
            },
          },
        }
      );

      if (error) {
        throw new Error("Failed to fetch timeline");
      }

      return data as Array<
        | (Comment & { type: "comment" })
        | (ActivityLog & { type: "activity" })
      >;
    },
    enabled: !!boardId && !!cardId,
  });
}

/**
 * Hook để lấy comments cho một card
 */
export function useComments(boardId: string, cardId: string) {
  return useQuery({
    queryKey: ["comments", boardId, cardId],
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/boards/{boardId}/cards/{cardId}/comments",
        {
          params: {
            path: {
              boardId,
              cardId,
            },
          },
        }
      );

      if (error) {
        throw new Error("Failed to fetch comments");
      }

      return data as Comment[];
    },
    enabled: !!boardId && !!cardId,
  });
}

/**
 * Hook để thêm comment mới
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      cardId: string;
      content: string;
    }) => {
      const { data, error } = await api.POST(
        "/boards/{boardId}/cards/{cardId}/comments",
        {
          params: {
            path: {
              boardId: params.boardId,
              cardId: params.cardId,
            },
          },
          body: {
            content: params.content,
          },
        }
      );

      if (error) {
        throw new Error("Failed to add comment");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      // Invalidate timeline và comments queries để refetch
      queryClient.invalidateQueries({
        queryKey: ["card-timeline", variables.boardId, variables.cardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.boardId, variables.cardId],
      });
      // Also invalidate board query in case it caches card data
      queryClient.invalidateQueries({
        queryKey: ["board", variables.boardId],
      });
    },

    onError: (err) => {
      console.error("Failed to add comment:", err);
    },
  });
}

/**
 * Hook để update comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      cardId: string;
      commentId: string;
      content: string;
    }) => {
      const { data, error } = await api.PUT(
        "/boards/{boardId}/cards/{cardId}/comments/{commentId}",
        {
          params: {
            path: {
              boardId: params.boardId,
              cardId: params.cardId,
              commentId: params.commentId,
            },
          },
          body: {
            content: params.content,
          },
        }
      );

      if (error) {
        throw new Error("Failed to update comment");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      // Invalidate timeline và comments queries để refetch
      queryClient.invalidateQueries({
        queryKey: ["card-timeline", variables.boardId, variables.cardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.boardId, variables.cardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["board", variables.boardId],
      });
    },

    onError: (err) => {
      console.error("Failed to update comment:", err);
    },
  });
}

/**
 * Hook để xóa comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      cardId: string;
      commentId: string;
    }) => {
      const { data, error } = await api.DELETE(
        "/boards/{boardId}/cards/{cardId}/comments/{commentId}",
        {
          params: {
            path: {
              boardId: params.boardId,
              cardId: params.cardId,
              commentId: params.commentId,
            },
          },
        }
      );

      if (error) {
        throw new Error("Failed to delete comment");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      // Invalidate timeline và comments queries để refetch
      queryClient.invalidateQueries({
        queryKey: ["card-timeline", variables.boardId, variables.cardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.boardId, variables.cardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["board", variables.boardId],
      });
    },

    onError: (err) => {
      console.error("Failed to delete comment:", err);
    },
  });
}

/**
 * Hook để lấy activities cho một card
 */
export function useActivities(boardId: string, cardId: string) {
  return useQuery({
    queryKey: ["activities", boardId, cardId],
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/boards/{boardId}/cards/{cardId}/activities",
        {
          params: {
            path: {
              boardId,
              cardId,
            },
          },
        }
      );

      if (error) {
        throw new Error("Failed to fetch activities");
      }

      return data as ActivityLog[];
    },
    enabled: !!boardId && !!cardId,
  });
}
