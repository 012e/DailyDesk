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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Card as CardType, Label, Member, Attachment, Comment, ActivityLog, CardCoverMode, RepeatFrequency } from "@/types/card";
import { useAtom } from "jotai";
import { isCardDialogOpenAtom, selectedCardAtom } from "./atoms";
import { useUpdateDue } from "@/hooks/use-due";


type NormalizedCard = CardType & {
  title: string;
  description?: string;
  color?: KanbanBoardCircleColor;
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
    startDate?: Date | string | null;
    dueAt?: Date | string | null;
    dueComplete?: boolean;
    reminderMinutes?: number | null;
    repeatFrequency?: RepeatFrequency | null;
    repeatInterval?: number | null;
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
  const updateDueMutation = useUpdateDue();

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
    startDate: card.startDate,
    dueAt: card.dueAt,
    dueComplete: card.dueComplete,
    reminderMinutes: card.reminderMinutes,
    repeatFrequency: card.repeatFrequency ?? null,
    repeatInterval: card.repeatInterval ?? null,
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
    e.preventDefault(); // Prevent default button behavior
    if (!normalizedCard.dueAt) return;
    updateDueMutation.mutate({
      boardId,
      cardId: normalizedCard.id,
      dueComplete: !normalizedCard.dueComplete,
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            role="checkbox"
                            aria-checked={normalizedCard.dueComplete}
                            tabIndex={-1}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              normalizedCard.dueComplete
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-white/70 hover:border-white'
                            }`}>
                              {normalizedCard.dueComplete && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{normalizedCard.dueComplete ? "Mark due incomplete" : "Mark due complete"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <KanbanBoardCardTitle className={`text-white drop-shadow-md line-clamp-2 ${normalizedCard.dueComplete ? "line-through opacity-75" : ""}`}>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            role="checkbox"
                            aria-checked={normalizedCard.dueComplete}
                            tabIndex={-1}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              normalizedCard.dueComplete
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-white/70 hover:border-white'
                            }`}>
                              {normalizedCard.dueComplete && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{normalizedCard.dueComplete ? "Mark due incomplete" : "Mark due complete"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <KanbanBoardCardTitle className={`text-white drop-shadow-sm line-clamp-2 ${normalizedCard.dueComplete ? "line-through opacity-75" : ""}`}>
                      {normalizedCard.title}
                    </KanbanBoardCardTitle>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={handleToggleComplete}
                        className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        role="checkbox"
                            aria-checked={normalizedCard.dueComplete}
                            tabIndex={-1}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ring-offset-background ${
                              normalizedCard.dueComplete
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-primary/50 hover:border-primary'
                        }`}>
                          {normalizedCard.dueComplete && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{normalizedCard.dueComplete ? "Mark due incomplete" : "Mark due complete"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <KanbanBoardCardTitle className={`line-clamp-2 ${normalizedCard.dueComplete ? "line-through text-muted-foreground opacity-50" : ""}`}>
                  {normalizedCard.title}
                </KanbanBoardCardTitle>
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
