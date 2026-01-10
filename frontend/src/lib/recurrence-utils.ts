import type { RecurrenceType } from "@/types/card";
import { addDays, addWeeks, addMonths, getDay, setDate, nextDay } from "date-fns";

/**
 * Calculate the next due date based on recurrence pattern
 * @param currentDate The current due date
 * @param recurrence The recurrence type
 * @param recurrenceDay The ordinal day (1-5 for 1st-5th)
 * @param recurrenceWeekday The day of week (0=Sunday, 6=Saturday)
 * @returns The next due date or null if no recurrence
 */
export function calculateNextDueDate(
  currentDate: Date,
  recurrence?: RecurrenceType,
  recurrenceDay?: number,
  recurrenceWeekday?: number
): Date | null {
  if (!recurrence || recurrence === "never") {
    return null;
  }

  switch (recurrence) {
    case "daily_weekdays": {
      // Add days until we hit a weekday (Mon-Fri)
      let nextDate = addDays(currentDate, 1);
      const dayOfWeek = getDay(nextDate);
      
      // If Saturday (6), skip to Monday
      if (dayOfWeek === 6) {
        nextDate = addDays(nextDate, 2);
      }
      // If Sunday (0), skip to Monday
      else if (dayOfWeek === 0) {
        nextDate = addDays(nextDate, 1);
      }
      
      return nextDate;
    }

    case "weekly": {
      // Add 7 days (one week)
      return addWeeks(currentDate, 1);
    }

    case "monthly_date": {
      // Repeat on the same date next month
      // For example, if due on Jan 15, next will be Feb 15
      return addMonths(currentDate, 1);
    }

    case "monthly_day": {
      // Repeat on a specific ordinal weekday (e.g., 2nd Sunday)
      if (recurrenceDay === undefined || recurrenceWeekday === undefined) {
        return null;
      }

      // Start from the first day of next month
      let nextMonth = addMonths(currentDate, 1);
      nextMonth = setDate(nextMonth, 1);

      // Find the nth occurrence of the specified weekday
      return findNthWeekdayInMonth(nextMonth, recurrenceWeekday, recurrenceDay);
    }

    default:
      return null;
  }
}

/**
 * Find the nth occurrence of a specific weekday in a month
 * @param date Any date in the target month
 * @param weekday The target day of week (0=Sunday, 6=Saturday)
 * @param occurrence The occurrence (1=1st, 2=2nd, etc.)
 * @returns The date of the nth occurrence
 */
function findNthWeekdayInMonth(
  date: Date,
  weekday: number,
  occurrence: number
): Date {
  // Start from the first day of the month
  const firstDay = setDate(date, 1);
  
  // Find the first occurrence of the target weekday
  let current = firstDay;
  const currentWeekday = getDay(current);
  
  // Calculate days to add to reach the first occurrence
  let daysToAdd = (weekday - currentWeekday + 7) % 7;
  current = addDays(current, daysToAdd);
  
  // Add weeks to reach the nth occurrence
  current = addWeeks(current, occurrence - 1);
  
  return current;
}

/**
 * Format recurrence pattern as human-readable text
 * @param recurrence The recurrence type
 * @param recurrenceDay The ordinal day (1-5 for 1st-5th)
 * @param recurrenceWeekday The day of week (0=Sunday, 6=Saturday)
 * @returns Human-readable recurrence description
 */
export function formatRecurrence(
  recurrence?: RecurrenceType,
  recurrenceDay?: number,
  recurrenceWeekday?: number
): string | null {
  if (!recurrence || recurrence === "never") {
    return null;
  }

  const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];

  switch (recurrence) {
    case "daily_weekdays":
      return "Daily (Monday to Friday)";
    case "weekly":
      return "Weekly";
    case "monthly_date":
      return "Monthly on due date";
    case "monthly_day":
      if (recurrenceDay && recurrenceWeekday !== undefined) {
        return `Monthly on the ${ORDINALS[recurrenceDay - 1]} ${
          WEEKDAYS[recurrenceWeekday]
        }`;
      }
      return "Monthly";
    default:
      return null;
  }
}

/**
 * Get a short recurrence label for badges
 * @param recurrence The recurrence type
 * @returns Short label like "Daily", "Weekly", etc.
 */
export function getRecurrenceShortLabel(recurrence?: RecurrenceType): string | null {
  if (!recurrence || recurrence === "never") {
    return null;
  }

  switch (recurrence) {
    case "daily_weekdays":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly_date":
    case "monthly_day":
      return "Monthly";
    default:
      return null;
  }
}
