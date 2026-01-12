import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface UserSearchResult {
  user_id: string;
  email?: string;
  name?: string;
  picture?: string;
  nickname?: string;
}

/**
 * Hook to search for users using Auth0 Management API
 */
export function useUserSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return [];
      }

      const { data, error } = await api.GET("/members/search", {
        params: {
          query: {
            q: query,
            per_page: "10",
            page: "0",
          },
        },
      });

      if (error) {
        throw new Error("Failed to search users");
      }

      return (data || []) as UserSearchResult[];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
}
