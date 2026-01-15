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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Card as CardType, Label, Member, Attachment, Comment, ActivityLog, CardCoverMode} from "@/types/card";
import { useAtom } from "jotai";
import { isCardDialogOpenAtom, selectedCardAtom } from "./atoms";
import { useUpdateCard } from "@/hooks/use-card";
import { LayoutTemplate } from "lucide-react";


type NormalizedCard = CardType & {
  title: string;
  description?: string;
  color?: KanbanBoardCircleColor;
  isTemplate?: boolean;
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
    isTemplate?: boolean;
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
    startDate: card.startDate,
    dueAt: card.dueAt,
    dueComplete: card.dueComplete,
    reminderMinutes: card.reminderMinutes,
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
    isTemplate: card.isTemplate,
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
                    <div className="flex flex-col gap-1 min-w-0">
                      {normalizedCard.isTemplate && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-blue-500/80 text-[10px] font-medium text-white max-w-fit pointer-events-none">
                          <LayoutTemplate className="h-3 w-3" />
                          Template
                        </div>
                      )}
                      <KanbanBoardCardTitle className={`text-white drop-shadow-md line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                        {normalizedCard.title}
                      </KanbanBoardCardTitle>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            role="checkbox"
                            aria-checked={normalizedCard.completed}
                            tabIndex={-1}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              normalizedCard.completed
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-white/70 hover:border-white'
                            }`}>
                              {normalizedCard.completed && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{normalizedCard.completed ? "Mark incomplete" : "Mark complete"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                    <div className="flex flex-col gap-1 min-w-0">
                      {normalizedCard.isTemplate && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-black/20 text-[10px] font-medium text-white max-w-fit pointer-events-none">
                          <LayoutTemplate className="h-3 w-3" />
                          Template
                        </div>
                      )}
                      <KanbanBoardCardTitle className={`text-white drop-shadow-sm line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                        {normalizedCard.title}
                      </KanbanBoardCardTitle>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            role="checkbox"
                            aria-checked={normalizedCard.completed}
                            tabIndex={-1}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              normalizedCard.completed
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-white/70 hover:border-white'
                            }`}>
                              {normalizedCard.completed && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{normalizedCard.completed ? "Mark incomplete" : "Mark complete"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <KanbanBoardCardTitle className={`text-white drop-shadow-sm line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
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
                        aria-checked={normalizedCard.completed}
                        tabIndex={-1}
                      >
                        <div className={`h-5 w-5 shrink-0 rounded-full border-2 ring-offset-background ${
                          normalizedCard.completed
                            ? 'bg-green-500 border-green-500 flex items-center justify-center'
                            : 'border-primary/50 hover:border-primary'
                        }`}>
                          {normalizedCard.completed && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{normalizedCard.completed ? "Mark incomplete" : "Mark complete"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <KanbanBoardCardTitle className={`line-clamp-2 ${normalizedCard.completed ? "line-through text-muted-foreground opacity-50" : ""}`}>
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
