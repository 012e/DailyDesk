"use client";

import { RiCalendarEventLine } from "@remixicon/react";
import { addDays, format, isToday } from "date-fns";
import { useMemo } from "react";

import {
  AgendaDaysToShow,
  type CalendarEvent,
  EventItem,
  getAgendaEventsForDay,
} from "@/components/event-calendar";

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
}

export function AgendaView({
  currentDate,
  events,
  onEventSelect,
}: AgendaViewProps) {
  // Show events for the next days based on constant
  const days = useMemo(() => {
    console.log("Agenda view updating with date:", currentDate.toISOString());
    return Array.from({ length: AgendaDaysToShow }, (_, i) =>
      addDays(new Date(currentDate), i),
    );
  }, [currentDate]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Agenda view event clicked:", event);
    onEventSelect(event);
  };

  // Check if there are any days with events
  const hasEvents = days.some(
    (day) => getAgendaEventsForDay(events, day).length > 0,
  );

  return (
    <div className="px-4 border-t border-border/70">
      {!hasEvents ? (
        <div className="flex flex-col justify-center items-center py-16 text-center min-h-[70svh]">
          <RiCalendarEventLine
            className="mb-2 text-muted-foreground/50"
            size={32}
          />
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-muted-foreground">
            There are no events scheduled for this time period.
          </p>
        </div>
      ) : (
        days.map((day) => {
          const dayEvents = getAgendaEventsForDay(events, day);

          if (dayEvents.length === 0) return null;

          return (
            <div
              className="relative my-12 border-t border-border/70"
              key={day.toString()}
            >
              <span
                className="flex absolute left-0 -top-3 items-center h-6 uppercase sm:text-xs bg-background pe-4 text-[10px] data-today:font-medium sm:pe-4"
                data-today={isToday(day) || undefined}
              >
                {format(day, "d MMM, EEEE")}
              </span>
              <div className="mt-6 space-y-2">
                {dayEvents.map((event) => (
                  <EventItem
                    event={event}
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    view="agenda"
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
