// Card types for Kanban board

export interface Label {
  id: string;
  name: string;
  color: string;
  userId?: string; // Labels belong to users, not boards
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Comment {
  id: string;
  text: string;
  content: string;
  userId: string;
  user: Member;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ActivityLog {
  id: string;
  activityType:
    | "comment"
    | "label"
    | "member"
    | "dueDate"
    | "attachment"
    | "description"
    | "title"
    | "move";
  userId: string;
  user: Member;
  action: string;
  description: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

// Timeline item types (discriminated union)
export type TimelineComment = Comment & { type: "comment" };
export type TimelineActivity = ActivityLog & { type: "activity" };
export type TimelineItem = TimelineComment | TimelineActivity;

export const CardCoverModeValue = {
  TOP: "top",
  COVER: "cover",
  NONE: null,
} as const;

export type CardCoverMode =
  (typeof CardCoverModeValue)[keyof typeof CardCoverModeValue];

export type RecurrenceType = "never" | "daily_weekdays" | "weekly" | "monthly_date" | "monthly_day";
export type RepeatFrequency = "daily" | "weekly" | "monthly";

export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  labels?: Label[];
  members?: Member[];
  dueDate?: Date;
  startDate?: Date | string | null;
  dueAt?: Date | string | null;
  dueComplete?: boolean;
  reminderMinutes?: number | null;
  recurrence?: RecurrenceType;
  recurrenceDay?: number; // 1st, 2nd, 3rd, 4th, 5th
  recurrenceWeekday?: number; // 0=Sunday, 6=Saturday
  repeatFrequency?: RepeatFrequency | null;
  repeatInterval?: number | null;
  coverUrl: string;
  coverColor: string;
  coverMode?: CardCoverMode;
  attachments?: Attachment[];
  comments?: Comment[];
  activities?: ActivityLog[];
  createdAt: Date;
  updatedAt: Date;
  order: number;
  completed?: boolean;
  isTemplate?: boolean;
}

export type DueStatus = "none" | "complete" | "overdue" | "dueSoon" | "dueLater";

export interface DueStatusResult {
  status: DueStatus;
  label: string;
  color: "default" | "success" | "destructive" | "warning" | "secondary";
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
  position: number;
}

// Card update payload
export type CardUpdatePayload = Partial<
  Omit<Card, "id" | "createdAt" | "updatedAt">
>;
