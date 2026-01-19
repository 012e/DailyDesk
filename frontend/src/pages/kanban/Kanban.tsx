import { CardEditDialog } from "@/components/card-edit-dialog";
import {
  KanbanBoard,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { useBoard, useUpdateBoard } from "@/hooks/use-board";
import { useUpdateCard, useDeleteCard } from "@/hooks/use-card";
import { useListActions } from "@/hooks/use-list";
import { useMembers } from "@/hooks/use-member";
import { useUploadImage } from "@/hooks/use-image";
import type { Card as CardType } from "@/types/card";
import { EventCalendar } from "@/components/event-calendar";
import { listsCardsToCalendarEvents } from "@/components/event-calendar/utils";
import { Button } from "@/components/ui/button";
import { useAtom, useSetAtom } from "jotai";
import { useDraggableScroll } from "@/hooks/use-draggable-scroll";
import { useEffect, useState, useMemo } from "react";
import { AddListForm } from "./AddListForm";
import {
  boardIdAtom,
  isCardDialogOpenAtom,
  selectedCardAtom,
} from "./atoms";
import { KanbanColumn } from "./KanbanColumn";
import { BoardHeaderBar } from "./BoardHeaderBar";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { cardMatchesFilters, emptyFilterState, type FilterState } from "@/components/board-filter-popover";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";
import { useSearchParams, useParams } from "react-router";
import { BoardEventsProvider } from "@/components/board-events-provider";

interface KanbanProps {
  boardId?: string;
}

export function Kanban({ boardId: propBoardId }: KanbanProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { boardId: paramBoardId } = useParams();
  const boardId = propBoardId || paramBoardId;

  const setBoardId = useSetAtom(boardIdAtom);
  const { createList, updateList, deleteList } = useListActions();
  
  // Ensure boardId is available before calling useBoard if possible, 
  // but since we can't conditionally call hooks, we pass it. 
  // If it's undefined, useBoard might throw/fail, but normally the route ensures we have an ID.
  const board = useBoard({ boardId: boardId! }); 
  const lists = board?.lists || [];
  const { user: currentUser } = useAuth0();
  const { data: members = [] } = useMembers(boardId || "");
  const { updateBoard } = useUpdateBoard();
  const { uploadImage } = useUploadImage();

  const [selectedCard, setSelectedCard] = useAtom(selectedCardAtom);
  const [isCardDialogOpen, setIsCardDialogOpen] = useAtom(isCardDialogOpenAtom);
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(emptyFilterState);
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");

  const { mutate: updateCard } = useUpdateCard();
  const { mutate: deleteCard } = useDeleteCard();

  const { ref: scrollRef, isDragging: _isDragging, ...dragEvents } = useDraggableScroll<HTMLDivElement>();

  // Auth0 user has 'sub' field for user ID
  const isOwner = currentUser?.sub === board?.userId;
  
  // Get current user's role from members list
  const currentUserMember = members.find(m => m.userId === currentUser?.sub);
  const currentUserRole = currentUserMember?.role as "admin" | "member" | undefined;
  const isAdmin = currentUserRole === "admin";

  // Get owner info - if current user is owner, use their info
  // Otherwise, we'll need to pass the userId for now (owner display in members list)
  const ownerInfo = isOwner && currentUser ? {
    userId: currentUser.sub!,
    name: currentUser.name || currentUser.nickname || currentUser.email || "Owner",
    email: currentUser.email || "",
    avatar: currentUser.picture || null,
  } : board?.userId ? {
    userId: board.userId,
    name: "Board Owner",
    email: "",
    avatar: null,
  } : undefined;

  // Handle URL query parameters for deep linking
  useEffect(() => {
    if (lists.length > 0) {
      const cardId = searchParams.get("cardId");
      if (cardId) {
        for (const list of lists) {
          const card = list.cards.find((c) => c.id === cardId);
          if (card) {
            setSelectedCard(card);
            setIsCardDialogOpen(true);
            
            // Remove the query param to prevent re-opening or conflicting state
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("cardId");
            setSearchParams(newParams, { replace: true });
            return; // Exit after handling cardId
          }
        }
      }

      const listId = searchParams.get("listId");
      if (listId) {
        // Find the list exists in board
        const listExists = lists.some(l => l.id === listId);
        if (listExists) {
           // We need to wait for DOM to be ready or assume it is.
           // Since lists > 0, they should be rendered.
           requestAnimationFrame(() => {
             const listElement = document.getElementById(`list-${listId}`);
             if (listElement) {
                listElement.scrollIntoView({ behavior: "smooth", inline: "center" });
             }
           });

           // Remove listId param
           const newParams = new URLSearchParams(searchParams);
           newParams.delete("listId");
           setSearchParams(newParams, { replace: true });
        }
      }
    }
  }, [searchParams, lists, setSelectedCard, setIsCardDialogOpen, setSearchParams]);

  // Filter and sort lists' cards based on active filters
  const filteredLists = useMemo(() => {
    return lists.map((list) => {
      // First filter by existing filters
      let cards = list.cards.filter((card) => cardMatchesFilters(card, filters));
      
      // Then filter by search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        cards = cards.filter((card) => 
          card.name.toLowerCase().includes(query) ||
          (card.description && card.description.toLowerCase().includes(query))
        );
      }
      
      // Then sort
      const sortedCards = [...cards];
      if (filters.sortBy !== "none") {
        sortedCards.sort((a, b) => {
          switch (filters.sortBy) {
            case "name-asc":
              return a.name.localeCompare(b.name);
            case "name-desc":
              return b.name.localeCompare(a.name);
            case "dueDate-asc":
              if (!a.deadline && !b.deadline) return 0;
              if (!a.deadline) return 1;
              if (!b.deadline) return -1;
              return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            case "dueDate-desc":
              if (!a.deadline && !b.deadline) return 0;
              if (!a.deadline) return 1;
              if (!b.deadline) return -1;
              return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
            case "createdAt-asc":
              // Use order as a proxy for creation order (lower order = older)
              return (a.order || 0) - (b.order || 0);
            case "createdAt-desc":
              // Use order as a proxy for creation order (higher order = newer)
              return (b.order || 0) - (a.order || 0);
            default:
              return 0;
          }
        });
      } else {
        // Default sort for cards: order
        sortedCards.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      
      return { ...list, cards: sortedCards };
    })
    .sort((a, b) => {
       // Sort lists by order
       return (a.order || 0) - (b.order || 0);
    });
  }, [lists, filters]);

  const calendarEvents = useMemo(() => {
    return listsCardsToCalendarEvents(filteredLists);
  }, [filteredLists]);

  // Handle board update
  const handleBoardUpdate = async (
    name: string,
    backgroundColor?: string,
    backgroundImage?: File
  ) => {
    if (!boardId) return;

    let backgroundUrl: string | undefined;
    if (backgroundImage) {
      const uploadResult = await uploadImage({ file: backgroundImage, type: "board", id: boardId }) as any;
      backgroundUrl = uploadResult?.secure_url;
    }

    await updateBoard(boardId, {
      id: board.id,
      name,
      lists: [],
      backgroundColor,
      backgroundUrl,
    });

    toast.success("Board updated!", { position: "bottom-left" });
  };

  useEffect(() => {
    setBoardId(boardId);
  }, [boardId, setBoardId]);

  const handleDropOverColumn = (
    columnId: string,
    dataTransferData: string,
    type: "card" | "column"
  ) => {
    if (!boardId) return;

    if (type === "column") {
      // Handle column reordering
      handleDropColumnOverColumn(columnId, dataTransferData);
      return;
    }

    // Handle card drop
    let cardId: string;
    try {
      const cardData = JSON.parse(dataTransferData);
      cardId = cardData.id;
    } catch (e) {
      console.error("Failed to parse drag data:", e);
      return;
    }

    const targetList = lists.find((l) => l.id === columnId);
    if (!targetList) return;

    const newOrder = targetList.cards.length;

    updateCard({
      boardId,
      cardId,
      listId: columnId,
      order: newOrder,
    });
  };

  const handleDropColumnOverColumn = async (
    targetColumnId: string,
    dataTransferData: string
  ) => {
    try {
      const draggedData = JSON.parse(dataTransferData);
      const draggedColumnId = draggedData.id;
      
      if (draggedColumnId === targetColumnId) return;
      
      // Find the dragged and target columns
      const sortedLists = [...lists].sort((a, b) => (a.order || 0) - (b.order || 0));
      const draggedIndex = sortedLists.findIndex((l) => l.id === draggedColumnId);
      const targetIndex = sortedLists.findIndex((l) => l.id === targetColumnId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Calculate new order for the dragged column
      let newOrder: number;
      if (targetIndex === 0) {
        // Moving to the beginning
        newOrder = (sortedLists[0].order || 0) - 10000;
      } else if (targetIndex === sortedLists.length - 1) {
        // Moving to the end
        newOrder = (sortedLists[sortedLists.length - 1].order || 0) + 10000;
      } else if (draggedIndex < targetIndex) {
        // Moving right: place after target
        const afterOrder = sortedLists[targetIndex].order || 0;
        const nextOrder = sortedLists[targetIndex + 1]?.order || afterOrder + 20000;
        newOrder = Math.floor((afterOrder + nextOrder) / 2);
      } else {
        // Moving left: place before target
        const beforeOrder = sortedLists[targetIndex].order || 0;
        const prevOrder = sortedLists[targetIndex - 1]?.order || beforeOrder - 20000;
        newOrder = Math.floor((prevOrder + beforeOrder) / 2);
      }
      
      await updateList(draggedColumnId, { order: newOrder });
    } catch (e) {
      console.error("Failed to reorder column:", e);
      toast.error("Failed to reorder list", { position: "bottom-left" });
    }
  };

  const handleDropOverListItem = (
    columnId: string,
    targetCardId: string,
    dataTransferData: string,
    dropDirection: KanbanBoardDropDirection
  ) => {
    if (!boardId) return;

    let draggedCardId: string;
    try {
      const cardData = JSON.parse(dataTransferData);
      draggedCardId = cardData.id;
    } catch (e) {
      console.error("Failed to parse drag data:", e);
      return;
    }

    if (draggedCardId === targetCardId) return;

    const targetList = lists.find((l) => l.id === columnId);
    if (!targetList) return;

    const targetCard = targetList.cards.find((c) => c.id === targetCardId);
    if (!targetCard) return;

    let newOrder = targetCard.order || 0;
    if (dropDirection === "bottom") {
      newOrder += 1;
    }

    updateCard({
      boardId,
      cardId: draggedCardId,
      listId: columnId,
      order: newOrder,
    });
  };

  const handleAddList = async (title: string) => {
    try {
      // Calculate next order
      const maxOrder = lists.reduce((max, list) => Math.max(max, list.order || 0), 0);
      const nextOrder = maxOrder + 10000;
      
      await createList({
        name: title,
        order: nextOrder,
      });
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleSaveColumnEdit = async (columnId: string, newName: string) => {
    try {
      await updateList(columnId, { name: newName });
      toast.success("List updated!", { position: "bottom-left" });
    } catch (error) {
      console.error("Failed to update list:", error);
      toast.error("Failed to update list", { position: "bottom-left" });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteList(columnId);
      toast.success("List deleted!", { position: "bottom-left" });
    } catch (error) {
      console.error("Failed to delete list:", error);
      toast.error("Failed to delete list", { position: "bottom-left" });
    }
  };

  const handleUpdateCard = (updatedCard: CardType) => {
    // TODO: Connect this to a backend mutation/hook.
    setSelectedCard(updatedCard);
  };

  const handleDeleteCard = (cardId: string) => {
    if (!boardId) return;
    
    deleteCard(
      { boardId, cardId },
      {
        onSuccess: () => {
          toast.success("Card deleted!", { position: "bottom-left" });
          setIsCardDialogOpen(false);
          setSelectedCard(null);
        },
        onError: () => {
          toast.error("Failed to delete card", { position: "bottom-left" });
        },
      }
    );
  };

  const totalCards = lists.reduce((acc, list) => acc + list.cards.length, 0);
  const doneCards = lists.reduce((acc, list) => {
    return acc + list.cards.filter((card) => card.completed).length;
  }, 0);
  const progress = totalCards === 0 ? 0 : (doneCards / totalCards) * 100;

  const isCalendarView = viewMode === "calendar";

  return (
    <BoardEventsProvider boardId={boardId || ""}>
      <KanbanBoardProvider>
      <div
        className={`relative w-full h-screen flex-1 flex flex-col overflow-hidden ${isCalendarView ? "" : "p-4"}`}
          style={{
            backgroundImage: board.backgroundUrl
              ? `url(${board.backgroundUrl})`
              : undefined,
            backgroundColor: board.backgroundColor ?? undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        >
          {!isCalendarView && (
            <BoardHeaderBar
              boardId={boardId || ""}
              boardName={board.name}
              members={members}
              isOwner={isOwner}
              isAdmin={isAdmin}
              currentUserRole={currentUserRole}
              creatorId={board?.userId || ""}
              currentUserId={currentUser?.sub || ""}
              ownerInfo={ownerInfo}
              filters={filters}
              onFiltersChange={setFilters}
              onEditBoard={() => setIsEditBoardOpen(true)}
              progress={progress}
            />
          )}
          <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1 shadow-lg backdrop-blur">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => setViewMode("kanban")}
              >
                Kanban
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => setViewMode("calendar")}
              >
                Calendar
              </Button>
            </div>
          </div>
          {isCalendarView ? (
            <div className="absolute inset-0 z-20 overflow-y-auto">
              <div className="min-h-full w-full bg-background">
                <EventCalendar events={calendarEvents} initialView="month" />
              </div>
            </div>
          ) : (
            <KanbanBoard ref={scrollRef} {...dragEvents} className=" cursor-grab active:cursor-grabbing pb-24 flex-1 overflow-x-auto overflow-y-auto items-start">
              {filteredLists.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  boardId={boardId || ""}
                  onDropOverColumn={(data, type) => handleDropOverColumn(column.id, data, type)}
                  onDropOverListItem={(targetCardId, data, direction) =>
                    handleDropOverListItem(column.id, targetCardId, data, direction)
                  }
                  onSaveColumnEdit={handleSaveColumnEdit}
                  onDeleteColumn={handleDeleteColumn}
                  onDeleteCard={handleDeleteCard}
                  index={index}
                />
              ))}

              <AddListForm onAddList={handleAddList} />

              <KanbanBoardExtraMargin />
            </KanbanBoard>
          )}

          <CardEditDialog
            card={selectedCard}
            boardId={boardId || ""}
            isOpen={isCardDialogOpen}
            onClose={() => {
              setIsCardDialogOpen(false);
            }}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
            ownerInfo={ownerInfo}
          />

          <EditBoardDialog
            open={isEditBoardOpen}
            onOpenChange={setIsEditBoardOpen}
            initialName={board.name}
            initialBackgroundUrl={board.backgroundUrl ?? undefined}
            initialBackgroundColor={board.backgroundColor ?? undefined}
            onSave={handleBoardUpdate}
          />
        </div>
      </KanbanBoardProvider>
    </BoardEventsProvider>
  );
}
