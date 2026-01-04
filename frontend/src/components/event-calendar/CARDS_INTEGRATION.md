# Card to Calendar Event Mapping

This document explains how Kanban cards are automatically mapped to calendar events in DailyDesk.

## Overview

The calendar view in DailyDesk automatically displays cards from your Kanban board as calendar events. Only cards with due dates are shown in the calendar.

## How It Works

### 1. **Automatic Syncing**
- Cards with due dates automatically appear in the calendar
- Changes to cards in the Kanban view are reflected in the calendar
- No manual event creation needed

### 2. **Card to Event Mapping**

Each card is converted to a calendar event using these rules:

| Card Field | Calendar Event Field | Notes |
|------------|---------------------|-------|
| `title` | `title` | Card title becomes event title |
| `description` | `description` | Card description becomes event description |
| `dueDate` | `end` | Card due date becomes event end time |
| `dueDate - 1 hour` | `start` | Event starts 1 hour before due date |
| `labels[0].color` | `color` | First label color determines event color |
| List name | `location` | List name shown as event location |
| `id` | `id` | Card ID used as event ID |

### 3. **Color Mapping**

Card label colors are mapped to calendar event colors:

- **Blue** → Sky (light blue)
- **Yellow** → Amber
- **Purple** → Violet
- **Red** → Rose
- **Green** → Emerald
- **Orange** → Orange
- **Default** → Sky (when no label)

### 4. **Event Duration**

All card-based events are created with a 1-hour duration, ending at the card's due date:
- Start: `dueDate - 1 hour`
- End: `dueDate`

## Usage

### In the Kanban Page

```tsx
import { EventCalendar } from "@/components/event-calendar";
import { listsCardsToCalendarEvents } from "@/components/event-calendar";
import { useBoard } from "@/hooks/use-board";

const board = useBoard({ boardId });
const calendarEvents = listsCardsToCalendarEvents(board.lists);

<EventCalendar events={calendarEvents} />
```

### Utility Functions

#### `cardToCalendarEvent(card, listName?)`
Converts a single card to a calendar event.

```typescript
const event = cardToCalendarEvent(card, "To Do");
// Returns CalendarEvent or null if card has no due date
```

#### `cardsToCalendarEvents(cards, listName?)`
Converts an array of cards to calendar events.

```typescript
const events = cardsToCalendarEvents(cards, "In Progress");
// Returns CalendarEvent[]
```

#### `listsCardsToCalendarEvents(lists)`
Converts all cards from multiple lists to calendar events.

```typescript
const events = listsCardsToCalendarEvents(board.lists);
// Returns CalendarEvent[] with list names as locations
```

## Example

### Card Data
```typescript
{
  id: "card-123",
  title: "Complete project documentation",
  description: "Write API docs and user guide",
  dueDate: new Date("2026-01-10T15:00:00"),
  labels: [{ id: "1", name: "High Priority", color: "red" }],
  listId: "list-1"
}
```

### Resulting Calendar Event
```typescript
{
  id: "card-123",
  title: "Complete project documentation",
  description: "Write API docs and user guide",
  start: new Date("2026-01-10T14:00:00"), // 1 hour before
  end: new Date("2026-01-10T15:00:00"),
  color: "rose", // Mapped from red label
  location: "To Do", // List name
  allDay: false
}
```

## Read-Only Behavior

Currently, calendar events are read-only and synced from cards:
- To add events: Create cards with due dates in Kanban view
- To update events: Edit cards in Kanban view
- To delete events: Delete cards in Kanban view

## Future Enhancements

Potential improvements for bidirectional sync:
1. Allow creating cards from calendar events
2. Update card due dates when dragging events in calendar
3. Support all-day events for cards
4. Multiple due dates per card (checkpoints)
