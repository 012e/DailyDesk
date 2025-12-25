"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

import {
  type CalendarEvent,
  DraggableEvent,
  DroppableCell,
  EventGap,
  EventHeight,
  EventItem,
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  sortEvents,
  useEventVisibility,
} from "@/components/event-calendar";
import { DefaultStartHour } from "@/components/event-calendar/constants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
}

export function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ end: calendarEnd, start: calendarStart });
  }, [currentDate]);

  const weekdays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(startOfWeek(new Date()), i);
      return format(date, "EEE");
    });
  }, []);

  const weeks = useMemo(() => {
    const result = [];
    let week = [];

    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (week.length === 7 || i === days.length - 1) {
        result.push(week);
        week = [];
      }
    }

    return result;
  }, [days]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  const [isMounted, setIsMounted] = useState(false);
  const { contentRef, getVisibleEventCount } = useEventVisibility({
    eventGap: EventGap,
    eventHeight: EventHeight,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="contents" data-slot="month-view">
      <div className="grid grid-cols-7 border-b border-border/70">
        {weekdays.map((day) => (
          <div
            className="py-2 text-sm text-center text-muted-foreground/70"
            key={day}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-fr">
        {weeks.map((week, weekIndex) => (
          <div
            className="grid grid-cols-7 [&:last-child>*]:border-b-0"
            key={`week-${week}`}
          >
            {week.map((day, dayIndex) => {
              if (!day) return null; // Skip if day is undefined

              const dayEvents = getEventsForDay(events, day);
              const spanningEvents = getSpanningEventsForDay(events, day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const cellId = `month-cell-${day.toISOString()}`;
              const allDayEvents = [...spanningEvents, ...dayEvents];
              const allEvents = getAllEventsForDay(events, day);

              const isReferenceCell = weekIndex === 0 && dayIndex === 0;
              const visibleCount = isMounted
                ? getVisibleEventCount(allDayEvents.length)
                : undefined;
              const hasMore =
                visibleCount !== undefined &&
                allDayEvents.length > visibleCount;
              const remainingCount = hasMore
                ? allDayEvents.length - visibleCount
                : 0;

              return (
                <div
                  className="border-r border-b last:border-r-0 group border-border/70 data-outside-cell:bg-muted/25 data-outside-cell:text-muted-foreground/70"
                  data-outside-cell={!isCurrentMonth || undefined}
                  data-today={isToday(day) || undefined}
                  key={day.toString()}
                >
                  <DroppableCell
                    date={day}
                    id={cellId}
                    onClick={() => {
                      const startTime = new Date(day);
                      startTime.setHours(DefaultStartHour, 0, 0);
                      onEventCreate(startTime);
                    }}
                  >
                    <div className="inline-flex justify-center items-center mt-1 text-sm rounded-full size-6 group-data-today:bg-primary group-data-today:text-primary-foreground">
                      {format(day, "d")}
                    </div>
                    <div
                      className="min-h-[calc((var(--event-height)+var(--event-gap))*2)] sm:min-h-[calc((var(--event-height)+var(--event-gap))*3)] lg:min-h-[calc((var(--event-height)+var(--event-gap))*4)]"
                      ref={isReferenceCell ? contentRef : null}
                    >
                      {sortEvents(allDayEvents).map((event, index) => {
                        const eventStart = new Date(event.start);
                        const eventEnd = new Date(event.end);
                        const isFirstDay = isSameDay(day, eventStart);
                        const isLastDay = isSameDay(day, eventEnd);

                        const isHidden =
                          isMounted && visibleCount && index >= visibleCount;

                        if (!visibleCount) return null;

                        if (!isFirstDay) {
                          return (
                            <div
                              aria-hidden={isHidden ? "true" : undefined}
                              className="aria-hidden:hidden"
                              key={`spanning-${event.id}-${day.toISOString().slice(0, 10)}`}
                            >
                              <EventItem
                                event={event}
                                isFirstDay={isFirstDay}
                                isLastDay={isLastDay}
                                onClick={(e) => handleEventClick(event, e)}
                                view="month"
                              >
                                <div aria-hidden={true} className="invisible">
                                  {!event.allDay && (
                                    <span>
                                      {format(
                                        new Date(event.start),
                                        "h:mm",
                                      )}{" "}
                                    </span>
                                  )}
                                  {event.title}
                                </div>
                              </EventItem>
                            </div>
                          );
                        }

                        return (
                          <div
                            aria-hidden={isHidden ? "true" : undefined}
                            className="aria-hidden:hidden"
                            key={event.id}
                          >
                            <DraggableEvent
                              event={event}
                              isFirstDay={isFirstDay}
                              isLastDay={isLastDay}
                              onClick={(e) => handleEventClick(event, e)}
                              view="month"
                            />
                          </div>
                        );
                      })}

                      {hasMore && (
                        <Popover modal>
                          <PopoverTrigger asChild>
                            <button
                              className="flex overflow-hidden items-center px-1 w-full text-left transition outline-none select-none sm:px-2 sm:text-xs mt-(--event-gap) h-(--event-height) text-[10px] text-muted-foreground backdrop-blur-md hover:bg-muted/50 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              onClick={(e) => e.stopPropagation()}
                              type="button"
                            >
                              <span>
                                + {remainingCount}{" "}
                                <span className="max-sm:sr-only">more</span>
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="center"
                            className="p-3 max-w-52"
                            style={
                              {
                                "--event-height": `${EventHeight}px`,
                              } as Record<string, string>
                            }
                          >
                            <div className="space-y-2">
                              <div className="text-sm font-medium">
                                {format(day, "EEE d")}
                              </div>
                              <div className="space-y-1">
                                {sortEvents(allEvents).map((event) => {
                                  const eventStart = new Date(event.start);
                                  const eventEnd = new Date(event.end);
                                  const isFirstDay = isSameDay(day, eventStart);
                                  const isLastDay = isSameDay(day, eventEnd);

                                  return (
                                    <EventItem
                                      event={event}
                                      isFirstDay={isFirstDay}
                                      isLastDay={isLastDay}
                                      key={event.id}
                                      onClick={(e) =>
                                        handleEventClick(event, e)
                                      }
                                      view="month"
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </DroppableCell>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
