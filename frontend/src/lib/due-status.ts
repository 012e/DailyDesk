import type { DueStatusResult } from "@/types/card";

const HOURS_24 = 24 * 60 * 60 * 1000;

export function getDueStatus(
  dueAt: Date | string | null | undefined,
  dueComplete: boolean = false,
  now: Date = new Date()
): DueStatusResult {
  if (!dueAt) {
    return {
      status: "none",
      label: "",
      color: "default",
    };
  }

  const dueDate = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const nowTime = now.getTime();
  const dueTime = dueDate.getTime();
  const diff = dueTime - nowTime;

  if (dueComplete) {
    return {
      status: "complete",
      label: "Complete",
      color: "success",
    };
  }

  if (diff < 0) {
    return {
      status: "overdue",
      label: "Overdue",
      color: "destructive",
    };
  }

  if (diff <= HOURS_24) {
    return {
      status: "dueSoon",
      label: "Due soon",
      color: "warning",
    };
  }

  return {
    status: "dueLater",
    label: "",
    color: "secondary",
  };
}

export function formatDueDate(dueAt: Date | string | null | undefined): string {
  if (!dueAt) return "";

  const date = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isSameYear = date.getFullYear() === now.getFullYear();

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const hasTime = hours !== "00" || minutes !== "00";

  if (isToday && hasTime) {
    return `Today at ${hours}:${minutes}`;
  }

  if (isToday) {
    return "Today";
  }

  let result = `${month} ${day}`;

  if (!isSameYear) {
    result += `, ${date.getFullYear()}`;
  }

  if (hasTime) {
    result += ` at ${hours}:${minutes}`;
  }

  return result;
}

export const REMINDER_OPTIONS = [
  { value: null, label: "None" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
] as const;
