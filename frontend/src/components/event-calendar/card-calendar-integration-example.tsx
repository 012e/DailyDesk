/**
 * Example: Card to Calendar Event Integration
 * 
 * This file demonstrates how to integrate Kanban cards with the calendar view.
 */

import { useMemo } from "react";
import { EventCalendar, type CalendarEvent, listsCardsToCalendarEvents } from "@/components/event-calendar";
import { useBoard } from "@/hooks/use-board";
import { toast } from "sonner";

interface CardCalendarIntegrationProps {
  boardId: string;
}

/**
 * Component that displays a calendar with events from Kanban cards
 * 
 * Features:
 * - Automatically converts cards with due dates to calendar events
 * - Updates in real-time when cards change
 * - Shows list names as event locations
 * - Maps label colors to event colors
 */
export function CardCalendarIntegration({ boardId }: CardCalendarIntegrationProps) {
  // Fetch board data
  const board = useBoard({ boardId });
  
  // Convert cards to calendar events
  // This automatically filters cards without due dates
  const calendarEvents = useMemo(() => {
    if (!board?.lists) return [];
    return listsCardsToCalendarEvents(board.lists);
  }, [board?.lists]);

  // Handle calendar event actions (read-only for now)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEventAdd = (_event: CalendarEvent) => {
    toast.info("Calendar is read-only", {
      description: "Create cards in Kanban view to add events with due dates",
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEventUpdate = (_event: CalendarEvent) => {
    toast.info("Calendar is read-only", {
      description: "Edit cards in Kanban view to update events",
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEventDelete = (_eventId: string) => {
    toast.info("Calendar is read-only", {
      description: "Delete cards in Kanban view to remove events",
    });
  };

  return (
    <div className="h-full">
      <EventCalendar
        events={calendarEvents}
        onEventAdd={handleEventAdd}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        initialView="month"
      />
    </div>
  );
}

/**
 * Example: Manual Card to Event Conversion
 */
export function ManualConversionExample() {
  const sampleCard = {
    id: "card-1",
    title: "Review pull request",
    description: "Review and merge the new feature branch",
    dueDate: new Date("2026-01-15T10:00:00"),
    labels: [{ id: "1", name: "Urgent", color: "red" }],
    listId: "list-1",
    position: 0,
    coverUrl: "",
    coverColor: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 0,
  };

  const sampleList = {
    id: "list-1",
    name: "In Progress",
    cards: [sampleCard],
  };

  // Method 1: Convert single card
  // const event = cardToCalendarEvent(sampleCard, "In Progress");
  
  // Method 2: Convert multiple cards
  // const events = cardsToCalendarEvents([sampleCard], "In Progress");
  
  // Method 3: Convert all cards from lists (recommended)
  const events = listsCardsToCalendarEvents([sampleList]);

  return (
    <EventCalendar
      events={events}
      onEventAdd={() => {}}
      onEventUpdate={() => {}}
      onEventDelete={() => {}}
    />
  );
}
