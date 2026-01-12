import { addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import type { RecurrenceType } from "@/types/card";
import { calculateNextDueDate } from "./recurrence-utils";

export interface RecurringEventInstance {
  instanceDate: Date;
  isOriginal: boolean;
}

/**
 * Generate recurring event instances within a date range
 * @param originalDate - The original due date of the card
 * @param recurrence - The recurrence pattern
 * @param recurrenceDay - For monthly_day pattern (1-5)
 * @param recurrenceWeekday - For monthly_day pattern (0-6)
 * @param rangeStart - Start of the date range to generate instances
 * @param rangeEnd - End of the date range to generate instances
 * @param maxInstances - Maximum number of instances to generate (default 100)
 * @returns Array of recurring event instances
 */
export function generateRecurringInstances(
  originalDate: Date,
  recurrence?: RecurrenceType,
  recurrenceDay?: number,
  recurrenceWeekday?: number,
  rangeStart?: Date,
  rangeEnd?: Date,
  maxInstances: number = 100
): RecurringEventInstance[] {
  if (!recurrence || recurrence === "never") {
    return [{ instanceDate: originalDate, isOriginal: true }];
  }

  const instances: RecurringEventInstance[] = [];
  
  // Add the original date
  instances.push({ instanceDate: originalDate, isOriginal: true });

  let currentDate = originalDate;
  let count = 0;

  // Generate instances up to maxInstances or rangeEnd
  while (count < maxInstances) {
    const nextDate = calculateNextDueDate(
      currentDate,
      recurrence,
      recurrenceDay,
      recurrenceWeekday
    );

    if (!nextDate) break;

    // Stop if we've exceeded the range end
    if (rangeEnd && isAfter(nextDate, rangeEnd)) {
      break;
    }

    // Only add if within range (if range is specified)
    if (!rangeStart || !isBefore(nextDate, rangeStart)) {
      instances.push({ instanceDate: nextDate, isOriginal: false });
    }

    currentDate = nextDate;
    count++;
  }

  return instances;
}

/**
 * Filter recurring instances to only those visible in the given date range
 * @param instances - Array of recurring instances
 * @param rangeStart - Start of visible range
 * @param rangeEnd - End of visible range
 * @returns Filtered array of instances
 */
export function filterInstancesByRange(
  instances: RecurringEventInstance[],
  rangeStart: Date,
  rangeEnd: Date
): RecurringEventInstance[] {
  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);

  return instances.filter((instance) => {
    const instanceDay = startOfDay(instance.instanceDate);
    return !isBefore(instanceDay, start) && !isAfter(instanceDay, end);
  });
}

/**
 * Get the date range for calendar view to pre-generate recurring instances
 * @param viewDate - The current view date (e.g., first day of month/week)
 * @param viewType - The calendar view type
 * @returns Object with start and end dates
 */
export function getCalendarRange(
  viewDate: Date,
  viewType: "month" | "week" | "day" | "agenda"
): { start: Date; end: Date } {
  const start = startOfDay(viewDate);
  
  switch (viewType) {
    case "month":
      // Generate for current month + 2 months ahead
      return {
        start: addDays(start, -7), // Include previous week for month view
        end: addMonths(start, 3),
      };
    case "week":
      // Generate for current week + 8 weeks ahead
      return {
        start: start,
        end: addWeeks(start, 9),
      };
    case "day":
      // Generate for current day + 30 days ahead
      return {
        start: start,
        end: addDays(start, 31),
      };
    case "agenda":
      // Generate for current date + 60 days ahead
      return {
        start: start,
        end: addDays(start, 61),
      };
    default:
      return {
        start: start,
        end: addMonths(start, 3),
      };
  }
}
