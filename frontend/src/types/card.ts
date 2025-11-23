// Card types for Kanban board

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
  userId: string;
  user: Member;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ActivityLog {
  id: string;
  type: 'comment' | 'label' | 'member' | 'dueDate' | 'attachment' | 'description' | 'title' | 'move';
  userId: string;
  user: Member;
  action: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  labels?: Label[];
  members?: Member[];
  dueDate?: Date;
  cover?: string; // URL hoặc color
  attachments?: Attachment[];
  comments?: Comment[];
  activities?: ActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
  position: number;
}

// Card update payload
export type CardUpdatePayload = Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt'>>;
