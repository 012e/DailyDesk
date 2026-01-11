import {
  KanbanBoardCard,
  KanbanBoardCardTitle,
  KanbanBoardColumnListItem,
  type KanbanBoardCircleColor,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { Card as CardType, Label, Member, Attachment, Comment, ActivityLog, CardCoverMode, RecurrenceType } from "@/types/card";
import { useAtom } from "jotai";
import { isCardDialogOpenAtom, selectedCardAtom } from "./atoms";
import { Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRecurrenceShortLabel } from "@/lib/recurrence-utils";
import { useUpdateCard } from "@/hooks/use-card";

type NormalizedCard = CardType & {
  title: string;
  description?: string;
  color?: KanbanBoardCircleColor;
  recurrence?: RecurrenceType;
  recurrenceDay?: number;
  recurrenceWeekday?: number;
};

interface KanbanCardProps {
  card: {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    listId?: string;
    position?: number;
    order?: number;
    labels?: Label[];
    members?: Member[];
    dueDate?: Date;
<<<<<<< HEAD
    startDate?: Date | string | null;
    dueAt?: Date | string | null;
    dueComplete?: boolean;
    reminderMinutes?: number | null;
=======
    recurrence?: RecurrenceType;
    recurrenceDay?: number;
    recurrenceWeekday?: number;
>>>>>>> origin/main
    coverUrl?: string;
    coverColor?: string;
    coverMode?: CardCoverMode;
    attachments?: Attachment[];
    comments?: Comment[];
    activities?: ActivityLog[];
    createdAt?: Date;
    updatedAt?: Date;
    color?: KanbanBoardCircleColor;
    completed?: boolean;
  };
  columnId: string;
  boardId: string;
  onDropOverListItem: (
    data: string,
    direction: KanbanBoardDropDirection
  ) => void;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({
  card,
  columnId,
  boardId,
  onDropOverListItem,
  onDelete,
}: KanbanCardProps) {
  const [, setSelectedCard] = useAtom(selectedCardAtom);
  const [, setIsCardDialogOpen] = useAtom(isCardDialogOpenAtom);
  const { mutate: updateCard } = useUpdateCard();

  const normalizedCard: NormalizedCard = {
    id: card.id,
    title: card.title || card.name || "Untitled",
    description: card.description || "",
    listId: card.listId || columnId,
    position: card.position || card.order || 0,
    order: card.order || 0,
    labels: card.labels || [],
    members: card.members || [],
    dueDate: card.dueDate,
<<<<<<< HEAD
    startDate: card.startDate,
    dueAt: card.dueAt,
    dueComplete: card.dueComplete,
    reminderMinutes: card.reminderMinutes,
=======
    recurrence: card.recurrence,
    recurrenceDay: card.recurrenceDay,
    recurrenceWeekday: card.recurrenceWeekday,
>>>>>>> origin/main
    coverUrl: card.coverUrl || "",
    coverColor: card.coverColor || "",
    coverMode: card.coverMode,
    attachments: card.attachments || [],
    comments: card.comments || [],
    activities: card.activities || [],
    createdAt: card.createdAt || new Date(),
    updatedAt: card.updatedAt || new Date(),
    color: card.color,
    completed: card.completed,
  };

  const recurrenceLabel = getRecurrenceShortLabel(normalizedCard.recurrence);

  const openCardDialog = () => {
    setSelectedCard(normalizedCard);
    setIsCardDialogOpen(true);
  };

  const handleDelete = () => {
    if (confirm("Delete this card?")) {
      onDelete(normalizedCard.id);
    }
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the card dialog
    updateCard({
      boardId,
      cardId: normalizedCard.id,
      completed: !normalizedCard.completed,
    });
  };

  return (
    <KanbanBoardColumnListItem
      key={normalizedCard.id}
      cardId={normalizedCard.id}
      onDropOverListItem={onDropOverListItem}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <KanbanBoardCard 
            data={normalizedCard} 
            onClick={openCardDialog}
            className={(normalizedCard.coverUrl || normalizedCard.coverColor) ? "!p-0 overflow-hidden" : ""}
          >
            {normalizedCard.coverUrl ? (
              <div className="relative w-full">
                <img
                  src={normalizedCard.coverUrl}
                  alt=""
                  className="w-full h-auto object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <div className="flex items-center gap-2">
                    <div onClick={handleToggleComplete} className="flex-shrink-0">
                      <Checkbox 
                        checked={normalizedCard.completed} 
                        className="border-white/70 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    </div>
                    <KanbanBoardCardTitle className={`text-white drop-shadow-md line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                      {normalizedCard.title}
                    </KanbanBoardCardTitle>
                  </div>
                </div>
              </div>
            ) : normalizedCard.coverColor ? (
              <div
                className="relative w-full min-h-[100px] flex items-end"
                style={{ backgroundColor: normalizedCard.coverColor }}
              >
                <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                  <div className="flex items-center gap-2">
                    <div onClick={handleToggleComplete} className="flex-shrink-0">
                      <Checkbox 
                        checked={normalizedCard.completed} 
                        className="border-white/70 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    </div>
                    <KanbanBoardCardTitle className={`text-white drop-shadow-sm line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                      {normalizedCard.title}
                    </KanbanBoardCardTitle>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div onClick={handleToggleComplete} className="flex-shrink-0">
                    <Checkbox 
                      checked={normalizedCard.completed} 
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </div>
                  <KanbanBoardCardTitle className={`line-clamp-2 ${normalizedCard.completed ? "line-through text-muted-foreground" : ""}`}>
                    {normalizedCard.title}
                  </KanbanBoardCardTitle>
                </div>
              </div>
            )}
          </KanbanBoardCard>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={openCardDialog}>Edit</ContextMenuItem>
          <ContextMenuItem onClick={handleDelete}>Remove</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </KanbanBoardColumnListItem>
  );
}
