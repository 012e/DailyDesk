export type ChecklistItemMember = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string | null;
};

export type ChecklistItem = {
  id: string;
  name: string;
  completed: boolean;
  order: number;
  cardId: string;
  members?: ChecklistItemMember[];
};

