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
import type { Card as CardType, Label, Member, Attachment, Comment, ActivityLog, CardCoverMode, RecurrenceType } from "@/types/card";
import { useAtom } from "jotai";
import { isCardDialogOpenAtom, selectedCardAtom } from "./atoms";
import { CheckCircle2, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRecurrenceShortLabel } from "@/lib/recurrence-utils";

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
    recurrence?: RecurrenceType;
    recurrenceDay?: number;
    recurrenceWeekday?: number;
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
  onDropOverListItem: (
    data: string,
    direction: KanbanBoardDropDirection
  ) => void;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({
  card,
  columnId,
  onDropOverListItem,
  onDelete,
}: KanbanCardProps) {
  const [, setSelectedCard] = useAtom(selectedCardAtom);
  const [, setIsCardDialogOpen] = useAtom(isCardDialogOpenAtom);

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
    recurrence: card.recurrence,
    recurrenceDay: card.recurrenceDay,
    recurrenceWeekday: card.recurrenceWeekday,
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
                    {normalizedCard.completed && (
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    )}
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
                    {normalizedCard.completed && (
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    )}
                    <KanbanBoardCardTitle className={`text-white drop-shadow-sm line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                      {normalizedCard.title}
                    </KanbanBoardCardTitle>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {normalizedCard.completed && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  <KanbanBoardCardTitle className={`line-clamp-2 ${normalizedCard.completed ? "line-through text-muted-foreground" : ""}`}>
                    {normalizedCard.title}
                  </KanbanBoardCardTitle>
                </div>
                {recurrenceLabel && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Repeat className="h-3 w-3" />
                    {recurrenceLabel}
                  </Badge>
                )}
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
