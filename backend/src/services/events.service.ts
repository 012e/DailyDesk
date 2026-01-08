/**
 * Event Service - In-memory event queue for Server-Sent Events (SSE)
 * Manages event distribution for real-time updates across board subscriptions
 */

export interface BoardEvent {
  type: 'board_changed';
  boardId: string;
  timestamp: number;
  data: {
    entityType: 'board' | 'list' | 'card';
    entityId: string;
    action: 'created' | 'updated' | 'deleted' | 'moved';
    userId?: string;
  };
}

type EventListener = (event: BoardEvent) => void;

/**
 * Event Queue Manager
 * Maintains a map of board subscriptions and dispatches events to listeners
 */
import { MultiReceiverChannel, SimpleReceiver } from "channel-ts";

class EventService {
  // Broadcast channel per board
  private channels: Map<string, MultiReceiverChannel<BoardEvent>> = new Map();
  // Track active receiver counts per board (subscribe/unsubscribe manage this)
  private receiverCounts: Map<string, number> = new Map();
  private eventHistory: Map<string, BoardEvent[]> = new Map();
  private readonly MAX_HISTORY_SIZE = 50; // Keep last 50 events per board

  private getOrCreateChannel(boardId: string) {
    let chan = this.channels.get(boardId);
    if (!chan) {
      chan = new MultiReceiverChannel<BoardEvent>();
      this.channels.set(boardId, chan);
      this.receiverCounts.set(boardId, 0);
    }
    return chan;
  }

  /**
   * Subscribe to events for a specific board.
   * Returns an object with the async `receiver` (async iterable) and an `unsubscribe` function.
   * Caller can iterate using: `for await (const ev of receiver) { ... }` and should call `unsubscribe()` when done
   */
  subscribe(boardId: string): { receiver: SimpleReceiver<BoardEvent>; unsubscribe: () => void } {
    const chan = this.getOrCreateChannel(boardId);
    const receiver = chan.receiver();

    // increment receiver count
    this.receiverCounts.set(boardId, (this.receiverCounts.get(boardId) ?? 0) + 1);

    let closed = false;

    const unsubscribe = () => {
      if (closed) return;
      closed = true;
      try {
        chan.removeReceiver(receiver);
      } catch (err) {
        // ignore removal errors
      }

      const current = (this.receiverCounts.get(boardId) ?? 1) - 1;
      if (current <= 0) {
        this.receiverCounts.delete(boardId);
        // remove channel to free memory; history is kept separately
        this.channels.delete(boardId);
      } else {
        this.receiverCounts.set(boardId, current);
      }
    };

    return { receiver, unsubscribe };
  }

  /**
   * Publish an event to all subscribers of a board
   */
  publish(event: BoardEvent): void {
    const { boardId } = event;

    // Add to event history
    if (!this.eventHistory.has(boardId)) {
      this.eventHistory.set(boardId, []);
    }

    const history = this.eventHistory.get(boardId)!;
    history.push(event);

    // Trim history if it exceeds max size
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }

    // If channel exists, send the event
    const chan = this.channels.get(boardId);
    if (chan) {
      try {
        chan.send(event);
      } catch (err) {
        console.error(`Failed to send event on channel for board ${boardId}:`, err);
      }
    }
  }

  /**
   * Get the number of active listeners for a board
   */
  getListenerCount(boardId: string): number {
    return this.receiverCounts.get(boardId) ?? 0;
  }

  /**
   * Get total number of active connections across all boards
   */
  getTotalConnections(): number {
    let total = 0;
    this.receiverCounts.forEach(count => (total += count));
    return total;
  }

  /**
   * Get recent event history for a board
   */
  getEventHistory(boardId: string, limit?: number): BoardEvent[] {
    const history = this.eventHistory.get(boardId) ?? [];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * Clear event history for a board
   */
  clearHistory(boardId: string): void {
    this.eventHistory.delete(boardId);
  }

  /**
   * Get statistics about the event service
   */
  getStats() {
    return {
      totalBoards: this.channels.size,
      totalConnections: this.getTotalConnections(),
      boardsWithHistory: this.eventHistory.size,
    };
  }
}

// Export singleton instance
export const eventService = new EventService();

// Helper functions to publish specific event types
export function publishBoardChanged(
  boardId: string,
  entityType: BoardEvent['data']['entityType'],
  entityId: string,
  action: BoardEvent['data']['action'],
  userId?: string
): void {
  eventService.publish({
    type: 'board_changed',
    boardId,
    timestamp: Date.now(),
    data: {
      entityType,
      entityId,
      action,
      userId,
    },
  });
}
