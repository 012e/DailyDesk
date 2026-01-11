export type CalendarView = "month" | "week" | "day" | "agenda";

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
  labels?: Label[];
  members?: Member[];
  listId?: string;
  isRecurring?: boolean;
  isRecurringInstance?: boolean;
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange";
