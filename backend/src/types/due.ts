import { z } from "@hono/zod-openapi";

export const ALLOWED_REMINDER_MINUTES = [5, 10, 15, 30, 60, 120, 1440] as const;

export const UpdateDueSchema = z.object({
  startDate: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  dueComplete: z.boolean().optional(),
  reminderMinutes: z.enum(["5", "10", "15", "30", "60", "120", "1440"]).transform(Number).optional().nullable(),
});

export const DueResponseSchema = z.object({
  startDate: z.string().datetime().nullable(),
  dueAt: z.string().datetime().nullable(),
  dueComplete: z.boolean(),
  reminderMinutes: z.number().nullable(),
});

export type UpdateDue = z.infer<typeof UpdateDueSchema>;
export type DueResponse = z.infer<typeof DueResponseSchema>;

export type DueStatus = "none" | "complete" | "overdue" | "dueSoon" | "dueLater";

export interface DueStatusResult {
  status: DueStatus;
  label: string;
  color: "default" | "success" | "destructive" | "warning" | "secondary";
}
