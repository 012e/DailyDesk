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
import { Clock, Repeat } from "lucide-react";
import type { Card as CardType, Label, Member, Attachment, Comment, ActivityLog, CardCoverMode, RepeatFrequency } from "@/types/card";
import { useAtom } from "jotai";
import { isCardDialogOpenAtom, selectedCardAtom } from "./atoms";
import { useUpdateDue } from "@/hooks/use-due";
import { useUpdateCard } from "@/hooks/use-card";
import { LayoutTemplate } from "lucide-react";
import { useEffect, useRef, useState } from "react";


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
  const updateDueMutation = useUpdateDue();
  const updateCardMutation = useUpdateCard();

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
    if (normalizedCard.dueAt) {
      updateDueMutation.mutate({
        boardId,
        cardId: normalizedCard.id,
        dueComplete: !normalizedCard.dueComplete,
      });
      return;
    }
    updateCardMutation.mutate({
      boardId,
      cardId: normalizedCard.id,
      completed: !normalizedCard.completed,
    });
  };

  const isDone = normalizedCard.dueAt
    ? !!normalizedCard.dueComplete
    : !!normalizedCard.completed;

  const [displayDueAt, setDisplayDueAt] = useState<Date | string | null>(
    normalizedCard.dueAt ?? null
  );
  const [isRenewing, setIsRenewing] = useState(false);
  const prevDueAtRef = useRef<Date | string | null>(normalizedCard.dueAt ?? null);
  const prevDueCompleteRef = useRef<boolean>(normalizedCard.dueComplete ?? false);

  useEffect(() => {
    const prevDueAt = prevDueAtRef.current;
    const prevDueComplete = prevDueCompleteRef.current;
    const nextDueAt = normalizedCard.dueAt ?? null;
    const nextDueComplete = normalizedCard.dueComplete ?? false;
    const hasRepeat = !!normalizedCard.repeatFrequency;

    const prevDueTime = prevDueAt ? new Date(prevDueAt).getTime() : null;
    const nextDueTime = nextDueAt ? new Date(nextDueAt).getTime() : null;
    const dueAtChanged = prevDueTime !== nextDueTime;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (hasRepeat && dueAtChanged && prevDueComplete && !nextDueComplete && prevDueAt && nextDueAt) {
      setDisplayDueAt(prevDueAt);
      setIsRenewing(true);
      timeoutId = setTimeout(() => {
        setDisplayDueAt(nextDueAt);
        setIsRenewing(false);
      }, 2000);
    } else {
      setDisplayDueAt(nextDueAt);
      setIsRenewing(false);
    }

    prevDueAtRef.current = nextDueAt;
    prevDueCompleteRef.current = nextDueComplete;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [normalizedCard.dueAt, normalizedCard.dueComplete, normalizedCard.repeatFrequency]);

  const formatShortDateVN = (value: Date | string) => {
    const date = typeof value === "string" ? new Date(value) : value;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day} thg ${month}`;
  };

  const getDateRangeLabel = () => {
    if (normalizedCard.startDate && displayDueAt) {
      return `${formatShortDateVN(normalizedCard.startDate)} - ${formatShortDateVN(displayDueAt)}`;
    }
    if (displayDueAt) {
      return formatShortDateVN(displayDueAt);
    }
    if (normalizedCard.startDate) {
      return formatShortDateVN(normalizedCard.startDate);
    }
    return "Repeats";
  };

  const shouldShowDateRow =
    !!normalizedCard.startDate || !!displayDueAt || !!normalizedCard.repeatFrequency;

  const DateRow = ({ className }: { className: string }) => (
    <div
      className={`relative flex items-center gap-1 text-xs rounded-sm px-1 py-0.5 ${className} ${
        isDone && !normalizedCard.repeatFrequency ? "bg-green-500/20" : ""
      }`}
    >
      {isRenewing && <span className="absolute inset-0 renew-flash rounded-sm" />}
      <Clock className="relative z-10 h-3 w-3" />
      <span className="relative z-10">{getDateRangeLabel()}</span>
      {normalizedCard.repeatFrequency && (
        <Repeat className={`relative z-10 h-3 w-3 opacity-70 ${isRenewing ? "renew-spin" : ""}`} />
      )}
    </div>
  );

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
            className={(normalizedCard.coverUrl || normalizedCard.coverColor) ? "!p-0 overflow-hidden relative group" : "relative group"}
          >
            {normalizedCard.coverUrl ? (
              <div className="relative w-full rounded-md hidden-cover-fix">
                {normalizedCard.isTemplate && (
                  <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-blue-500 text-[10px] font-medium text-white shadow-sm">
                    <LayoutTemplate className="h-3 w-3" />
                    Template
                  </div>
                )}
                <img
                  src={normalizedCard.coverUrl}
                  alt=""
                  className="w-full h-auto object-contain rounded-md"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className={`flex-shrink-0 cursor-pointer transition-opacity ${isDone ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                            role="checkbox"
                            aria-checked={isDone}
                            tabIndex={-1}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              isDone
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-white/70 hover:border-white'
                            }`}>
                              {isDone && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isDone ? "Mark incomplete" : "Mark complete"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex flex-col gap-1 min-w-0">
                      <KanbanBoardCardTitle className={`text-white drop-shadow-md line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                        {normalizedCard.title}
                      </KanbanBoardCardTitle>
                    </div>
                  </div>
                  {shouldShowDateRow && <DateRow className="text-white/80" />}
                </div>
              </div>
            ) : normalizedCard.coverColor ? (
              <div
                className="relative w-full min-h-[100px] flex items-end rounded-md"
                style={{ backgroundColor: normalizedCard.coverColor }}
              >
                {normalizedCard.isTemplate && (
                  <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-black/20 backdrop-blur-[1px] text-[10px] font-medium text-white shadow-sm">
                    <LayoutTemplate className="h-3 w-3" />
                    Template
                  </div>
                )}
                <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className={`flex-shrink-0 cursor-pointer transition-opacity ${isDone ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                            role="checkbox"
                            aria-checked={isDone}
                            tabIndex={-1}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              isDone
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-white/70 hover:border-white'
                            }`}>
                              {isDone && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isDone ? "Mark incomplete" : "Mark complete"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex flex-col gap-1 min-w-0">
                      <KanbanBoardCardTitle className={`text-white drop-shadow-sm line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                        {normalizedCard.title}
                      </KanbanBoardCardTitle>
                    </div>
                  </div>
                  {shouldShowDateRow && <DateRow className="text-white/80 " />}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 pt-1">
                 {normalizedCard.isTemplate && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] font-medium max-w-fit mb-0.5">
                    <LayoutTemplate className="h-3 w-3" />
                    Template
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={handleToggleComplete}
                          className={`flex-shrink-0 cursor-pointer transition-opacity ${isDone ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                          role="checkbox"
                          aria-checked={isDone}
                          tabIndex={-1}
                        >
                          <div className={`h-5 w-5 shrink-0 rounded-full border-2 ring-offset-background ${
                            isDone
                              ? 'bg-green-500 border-green-500 flex items-center justify-center'
                              : 'border-primary/50 hover:border-primary'
                          }`}>
                            {isDone && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isDone ? "Mark incomplete" : "Mark complete"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <KanbanBoardCardTitle className={`line-clamp-2 ${isDone ? "!text-green-600" : ""}`}>
                    {normalizedCard.title}
                  </KanbanBoardCardTitle>
                </div>
                {shouldShowDateRow && <DateRow className="text-muted-foreground px-6" />}
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
