# Server-Sent Events (SSE) Implementation

This implementation provides real-time updates for board changes using Server-Sent Events.

## Overview

The SSE implementation consists of:
1. **Event Service** (`services/events.service.ts`) - In-memory event queue
2. **SSE Route** (`routes/sse.ts`) - SSE endpoint for subscribing to board events
3. **Event Publishing** - Integrated into board, list, and card services

## Event Service

The event service maintains an in-memory queue of events per board. It supports:
- Subscribing/unsubscribing to board events
- Publishing events to all subscribers
- Event history (last 50 events per board)
- Statistics and monitoring

### Event Structure

```typescript
interface BoardEvent {
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
```

## API Endpoint

### Subscribe to Board Events

```
GET /boards/:boardId/sse
```

**Authentication**: Required (Bearer token)

**Response**: Server-Sent Event stream

**Event Types**:
- `connected` - Initial connection message
- `history` - Recent event history (last 10 events)
- `board_changed` - Real-time board change event
- `ping` - Keep-alive message (every 30 seconds)

## Usage Example

### JavaScript/TypeScript Frontend

```typescript
// Connect to SSE endpoint
const boardId = 'your-board-id';
const token = 'your-auth-token';

const eventSource = new EventSource(
  `http://localhost:3000/boards/${boardId}/sse`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// Handle connection
eventSource.addEventListener('connected', (event) => {
  const data = JSON.parse(event.data);
  console.log('Connected to board events:', data);
});

// Handle event history
eventSource.addEventListener('history', (event) => {
  const data = JSON.parse(event.data);
  console.log('Event history:', data.events);
});

// Handle board changes
eventSource.addEventListener('board_changed', (event) => {
  const boardEvent = JSON.parse(event.data);
  console.log('Board changed:', boardEvent);
  
  // Update UI based on event
  switch (boardEvent.data.entityType) {
    case 'board':
      handleBoardChange(boardEvent);
      break;
    case 'list':
      handleListChange(boardEvent);
      break;
    case 'card':
      handleCardChange(boardEvent);
      break;
  }
});

// Handle keep-alive pings
eventSource.addEventListener('ping', (event) => {
  console.log('Keep-alive ping');
});

// Handle errors
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // EventSource will automatically reconnect
};

// Close connection when done
function cleanup() {
  eventSource.close();
}
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';

interface BoardEvent {
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

export function useBoardEvents(boardId: string, token: string) {
  const [events, setEvents] = useState<BoardEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `http://localhost:3000/boards/${boardId}/sse`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
    });

    eventSource.addEventListener('board_changed', (event) => {
      const boardEvent = JSON.parse(event.data) as BoardEvent;
      setEvents(prev => [...prev, boardEvent]);
    });

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [boardId, token]);

  return { events, isConnected };
}
```

## Event Publishing

Events are automatically published when:

### Board Events
- `board.created` - New board created
- `board.updated` - Board properties changed (name, background, etc.)
- `board.deleted` - Board deleted

### List Events
- `list.created` - New list created
- `list.updated` - List properties changed (name, order)
- `list.deleted` - List deleted

### Card Events
- `card.created` - New card created
- `card.updated` - Card properties changed
- `card.moved` - Card moved to different list
- `card.deleted` - Card deleted

## Architecture Notes

### In-Memory Storage
- Events are stored in memory, not persisted to database
- Event history limited to last 50 events per board
- All data is lost on server restart

### Scalability Considerations
- Current implementation is single-server only
- For multi-server deployments, consider:
  - Redis pub/sub for event distribution
  - Sticky sessions for SSE connections
  - External message queue (RabbitMQ, Kafka)

### Connection Management
- Automatic reconnection handled by browser's EventSource
- Keep-alive pings every 30 seconds prevent timeout
- Clean disconnection on client close

## Testing

### Manual Testing with curl

```bash
# Subscribe to board events
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -N http://localhost:3000/boards/BOARD_ID/sse

# In another terminal, make changes to the board
curl -X PUT http://localhost:3000/boards/BOARD_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Board Name"}'
```

### Testing with HTTPie

```bash
# Subscribe to events
http --stream GET localhost:3000/boards/BOARD_ID/sse \
  Authorization:"Bearer YOUR_TOKEN"
```

## Future Enhancements

Potential improvements:
- [ ] Event filtering by entity type
- [ ] Event replay from specific timestamp
- [ ] WebSocket alternative for bidirectional communication
- [ ] Presence tracking (who's viewing the board)
- [ ] Typing indicators for comments
- [ ] Redis backend for horizontal scaling
- [ ] Event persistence to database
- [ ] Rate limiting per client
- [ ] Event compression for large payloads
