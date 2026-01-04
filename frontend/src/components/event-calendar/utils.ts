import { isSameDay, addHours } from "date-fns";

import type { CalendarEvent, EventColor } from "@/components/event-calendar";

/**
 * CardLike type that works with both frontend Card and backend API response
 */
type CardLike = {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  dueDate?: Date | null;
  deadline?: Date | string | null;
  labels?: Array<{ color?: string }> | null;
};

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
    case "amber":
      return "bg-amber-200/50 hover:bg-amber-200/40 text-amber-950/80 dark:bg-amber-400/25 dark:hover:bg-amber-400/20 dark:text-amber-200 shadow-amber-700/8";
    case "violet":
      return "bg-violet-200/50 hover:bg-violet-200/40 text-violet-950/80 dark:bg-violet-400/25 dark:hover:bg-violet-400/20 dark:text-violet-200 shadow-violet-700/8";
    case "rose":
      return "bg-rose-200/50 hover:bg-rose-200/40 text-rose-950/80 dark:bg-rose-400/25 dark:hover:bg-rose-400/20 dark:text-rose-200 shadow-rose-700/8";
    case "emerald":
      return "bg-emerald-200/50 hover:bg-emerald-200/40 text-emerald-950/80 dark:bg-emerald-400/25 dark:hover:bg-emerald-400/20 dark:text-emerald-200 shadow-emerald-700/8";
    case "orange":
      return "bg-orange-200/50 hover:bg-orange-200/40 text-orange-950/80 dark:bg-orange-400/25 dark:hover:bg-orange-400/20 dark:text-orange-200 shadow-orange-700/8";
    default:
      return "bg-sky-200/50 hover:bg-sky-200/40 text-sky-950/80 dark:bg-sky-400/25 dark:hover:bg-sky-400/20 dark:text-sky-200 shadow-sky-700/8";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean,
): string {
  if (isFirstDay && isLastDay) {
    return "rounded"; // Both ends rounded
  }
  if (isFirstDay) {
    return "rounded-l rounded-r-none"; // Only left end rounded
  }
  if (isLastDay) {
    return "rounded-r rounded-l-none"; // Only right end rounded
  }
  return "rounded-none"; // No rounded corners
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Map label color to calendar event color
 * 
 * @param labelColor - The color string from a card label (e.g., "red", "blue", "bg-red-500")
 * @returns The corresponding EventColor for the calendar
 * 
 * @example
 * mapLabelColorToEventColor("red") // Returns "rose"
 * mapLabelColorToEventColor("blue") // Returns "sky"
 * mapLabelColorToEventColor("bg-green-500") // Returns "emerald"
 */
function mapLabelColorToEventColor(labelColor?: string): EventColor {
  if (!labelColor) return "sky";
  
  const colorMap: Record<string, EventColor> = {
    blue: "sky",
    yellow: "amber",
    purple: "violet",
    red: "rose",
    green: "emerald",
    orange: "orange",
  };

  // Check if the label color matches any of our mappings
  for (const [key, value] of Object.entries(colorMap)) {
    if (labelColor.toLowerCase().includes(key)) {
      return value;
    }
  }

  return "sky"; // Default color
}

/**
 * Convert a Card to a CalendarEvent
 * 
 * Only cards with dueDate/deadline will be converted to events. The event will be created
 * with a 1-hour duration ending at the card's due date.
 * 
 * Works with both frontend Card type (title, dueDate) and backend API response (name, deadline).
 * 
 * @param card - The card to convert (Card or API response format)
 * @param listName - Optional list name to include in event location
 * @returns CalendarEvent if card has a due date, null otherwise
 * 
 * @example
 * const card = {
 *   id: "card-1",
 *   title: "Complete docs",
 *   dueDate: new Date("2026-01-10T15:00:00"),
 *   labels: [{ color: "red", name: "Urgent" }],
 * };
 * 
 * const event = cardToCalendarEvent(card, "To Do");
 * // Returns:
 * // {
 * //   id: "card-1",
 * //   title: "Complete docs",
 * //   start: Date("2026-01-10T14:00:00"), // 1 hour before
 * //   end: Date("2026-01-10T15:00:00"),
 * //   color: "rose",
 * //   location: "To Do"
 * // }
 */
export function cardToCalendarEvent(card: CardLike, listName?: string): CalendarEvent | null {
  // Handle both 'deadline' (backend) and 'dueDate' (frontend) fields
  const dueDateValue = card.dueDate ?? card.deadline;
  
  if (!dueDateValue) {
    return null; // Only cards with due dates should appear in calendar
  }

  // Convert to Date if it's a string
  const dueDate = typeof dueDateValue === 'string' ? new Date(dueDateValue) : dueDateValue;
  
  // Handle both 'name' (backend) and 'title' (frontend) fields
  const title = card.title ?? card.name ?? "Untitled";
  
  // Determine color based on card labels
  const color = card.labels && card.labels.length > 0 && card.labels[0].color
    ? mapLabelColorToEventColor(card.labels[0].color)
    : "sky";

  // Create a 1-hour event ending at the due date
  const start = addHours(dueDate, -1);
  
  return {
    id: card.id,
    title: title,
    description: card.description ?? undefined,
    start: start,
    end: dueDate,
    allDay: false,
    color: color,
    location: listName, // Use list name as location
  };
}

/**
 * Convert multiple Cards to CalendarEvents
 * Filters out cards without due dates
 * @param cards - Array of cards to convert (works with both frontend and backend types)
 * @param listName - Optional list name to include in event location
 */
export function cardsToCalendarEvents(cards: CardLike[], listName?: string): CalendarEvent[] {
  return cards
    .map((card) => cardToCalendarEvent(card, listName))
    .filter((event): event is CalendarEvent => event !== null);
}

/**
 * Convert all cards from multiple lists to calendar events
 * @param lists - Array of lists containing cards (works with both frontend and backend types)
 * @returns Array of calendar events with list names as locations
 */
export function listsCardsToCalendarEvents(lists: Array<{ id: string; name?: string; title?: string; cards: CardLike[] }>): CalendarEvent[] {
  const allEvents: CalendarEvent[] = [];
  
  for (const list of lists) {
    const listName = list.name || list.title || "Untitled List";
    const events = list.cards
      .map((card) => cardToCalendarEvent(card, listName))
      .filter((event): event is CalendarEvent => event !== null);
    
    allEvents.push(...events);
  }
  
  return allEvents;
}

