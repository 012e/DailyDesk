import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { accessTokenAtom } from "@/stores/access-token";
import getConfig from "@/lib/config";
import { useQueryClient } from "@tanstack/react-query";

interface BoardEvent {
  type: "board_changed";
  boardId: string;
  timestamp: number;
  data: {
    entityType: "board" | "list" | "card";
    entityId: string;
    action: "created" | "updated" | "deleted" | "moved";
    userId?: string;
  };
}

interface BoardEventsProviderProps {
  boardId: string;
  children: ReactNode;
}

export function BoardEventsProvider({
  boardId,
  children,
}: BoardEventsProviderProps) {
  const accessToken = useAtomValue(accessTokenAtom);
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!boardId || !accessToken || !queryClient) {
      return;
    }

    const config = getConfig();
    const url = `${config.backendUrl}/boards/${boardId}/sse`;

    console.log(`[BoardEvents] Connecting to SSE: ${url}`);

    // Note: EventSource doesn't support custom headers in most browsers
    // So we need to pass the token as a query parameter or use a different approach
    // For now, we'll try to connect and handle the authentication on the backend
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      console.log("[BoardEvents] Connected to board events:", data);
    });

    eventSource.addEventListener("history", (event) => {
      const data = JSON.parse(event.data);
      console.log("[BoardEvents] Event history received:", data.events);
    });

    eventSource.addEventListener("board_changed", (event) => {
      const boardEvent = JSON.parse(event.data) as BoardEvent;
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      console.log("[BoardEvents] Board changed:", {
        entityType: boardEvent.data.entityType,
        entityId: boardEvent.data.entityId,
        action: boardEvent.data.action,
        userId: boardEvent.data.userId,
        timestamp: new Date(boardEvent.timestamp).toISOString(),
      });
    });

    eventSource.addEventListener("ping", () => {
      console.log("[BoardEvents] Keep-alive ping received");
    });

    eventSource.onerror = (error) => {
      console.error("[BoardEvents] SSE error:", error);

      // EventSource will automatically try to reconnect
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("[BoardEvents] Connection closed, will retry...");
      }
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log("[BoardEvents] Disconnecting from SSE");
      eventSource.close();
    };
  }, [boardId, accessToken, queryClient]);

  return <>{children}</>;
}
