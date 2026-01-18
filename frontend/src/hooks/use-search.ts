import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type SearchType = "board" | "card" | "list" | "comment" | "label" | "checklist";

export interface UseSearchOptions {
  query: string;
  types?: SearchType[];
  boardId?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to search across multiple entity types
 */
export function useSearch(options: UseSearchOptions) {
  const { query, types, boardId, limit = 20, enabled = true } = options;

  // Only enable the query if there's a search query and it's explicitly enabled
  const shouldFetch = enabled && query?.trim().length > 0;

  return useQuery({
    queryKey: ["search", query, types, boardId, limit],
    queryFn: async () => {
      const params: {
        q: string;
        types?: SearchType[];
        boardId?: string;
        limit: number;
      } = {
        q: query.trim(),
        limit,
      };

      if (types && types.length > 0) {
        params.types = types;
      }

      if (boardId) {
        params.boardId = boardId;
      }

      const { data, error } = await api.GET("/search", {
        params: {
          query: params,
        },
      });

      if (error) {
        throw new Error(`Search failed: ${error}`);
      }

      return data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to get grouped search results by type
 */
export function useGroupedSearch(options: UseSearchOptions) {
  const searchResult = useSearch(options);

  // Calculate grouped results directly. 
  // If data is loading or empty, default to an empty object.
  const results = searchResult.data?.results || [];
  
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return {
    ...searchResult,
    groupedResults,
  };
}