import { OpenAPIHono } from "@hono/zod-openapi";
import { eventService, BoardEvent } from "@/services/events.service";
import { streamSSE } from "hono/streaming";

export default function createSSERoutes() {
  const app = new OpenAPIHono();

  /**
   * SSE endpoint for board events
   * GET /boards/:id/sse
   *
   * Subscribes to real-time events for a specific board
   * Events include changes to board properties, lists, and cards
   */
  app.get("/:id/sse", async (c) => {
    const boardId = c.req.param("id");

    return streamSSE(c, async (stream) => {
      let isStreamClosed = false;

      // Create a receiver for this board and iterate events
      const { receiver, unsubscribe } = eventService.subscribe(boardId);

      try {
        for await (const event of receiver) {
          if (isStreamClosed) break;
          try {
            await stream.writeSSE({
              data: JSON.stringify(event),
              event: event.type,
              id: String(event.timestamp),
            });
          } catch (error) {
            console.error(`Error writing SSE for board ${boardId}:`, error);
            isStreamClosed = true;
            // stop iteration / cleanup
            try {
              unsubscribe();
            } catch (e) {
              // ignore
            }
            break;
          }
        }
      } catch (err) {
        if (!isStreamClosed) {
          console.error(`Event receiver error for board ${boardId}:`, err);
        }
      }

      // Clean up on stream close
      stream.onAbort(() => {
        isStreamClosed = true;
        unsubscribe();
      });
    });
  });

  return app;
}
