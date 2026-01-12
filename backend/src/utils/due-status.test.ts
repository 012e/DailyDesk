import { describe, it, expect } from "vitest";
import { getDueStatus, formatDueDate, validateReminderMinutes } from "./due-status";

describe("getDueStatus", () => {
  const now = new Date("2024-01-10T12:00:00Z");

  it("should return 'none' status when dueAt is null", () => {
    const result = getDueStatus(null, false, now);
    expect(result.status).toBe("none");
    expect(result.label).toBe("");
    expect(result.color).toBe("default");
  });

  it("should return 'none' status when dueAt is undefined", () => {
    const result = getDueStatus(undefined, false, now);
    expect(result.status).toBe("none");
  });

  it("should return 'complete' status when dueComplete is true", () => {
    const dueAt = new Date("2024-01-11T12:00:00Z");
    const result = getDueStatus(dueAt, true, now);
    expect(result.status).toBe("complete");
    expect(result.label).toBe("Complete");
    expect(result.color).toBe("success");
  });

  it("should return 'overdue' status when past due date", () => {
    const dueAt = new Date("2024-01-09T12:00:00Z");
    const result = getDueStatus(dueAt, false, now);
    expect(result.status).toBe("overdue");
    expect(result.label).toBe("Overdue");
    expect(result.color).toBe("destructive");
  });

  it("should return 'dueSoon' status when within 24 hours", () => {
    const dueAt = new Date("2024-01-11T10:00:00Z");
    const result = getDueStatus(dueAt, false, now);
    expect(result.status).toBe("dueSoon");
    expect(result.label).toBe("Due soon");
    expect(result.color).toBe("warning");
  });

  it("should return 'dueLater' status when more than 24 hours away", () => {
    const dueAt = new Date("2024-01-15T12:00:00Z");
    const result = getDueStatus(dueAt, false, now);
    expect(result.status).toBe("dueLater");
    expect(result.label).toBe("");
    expect(result.color).toBe("secondary");
  });

  it("should handle string dates", () => {
    const dueAt = "2024-01-09T12:00:00Z";
    const result = getDueStatus(dueAt, false, now);
    expect(result.status).toBe("overdue");
  });
});

describe("formatDueDate", () => {
  it("should return empty string for null", () => {
    expect(formatDueDate(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(formatDueDate(undefined)).toBe("");
  });

  it("should format date without time", () => {
    const date = new Date("2024-03-15T00:00:00Z");
    const result = formatDueDate(date);
    expect(result).toContain("Mar 15");
  });

  it("should format date with time", () => {
    const date = new Date("2024-03-15T14:30:00Z");
    const result = formatDueDate(date);
    expect(result).toContain("Mar 15");
    expect(result).toContain("at");
  });

  it("should include year if different from current year", () => {
    const date = new Date("2025-03-15T00:00:00Z");
    const result = formatDueDate(date);
    expect(result).toContain("2025");
  });

  it("should handle string dates", () => {
    const date = "2024-03-15T14:30:00Z";
    const result = formatDueDate(date);
    expect(result).toContain("Mar 15");
  });
});

describe("validateReminderMinutes", () => {
  it("should return true for null", () => {
    expect(validateReminderMinutes(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(validateReminderMinutes(undefined)).toBe(true);
  });

  it("should return true for valid values", () => {
    expect(validateReminderMinutes(5)).toBe(true);
    expect(validateReminderMinutes(10)).toBe(true);
    expect(validateReminderMinutes(60)).toBe(true);
    expect(validateReminderMinutes(1440)).toBe(true);
  });

  it("should return false for invalid values", () => {
    expect(validateReminderMinutes(7)).toBe(false);
    expect(validateReminderMinutes(100)).toBe(false);
    expect(validateReminderMinutes(-5)).toBe(false);
  });
});
