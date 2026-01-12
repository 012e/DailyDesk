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

interface KanbanProps {
  boardId?: string;
}

export function Kanban({ boardId }: KanbanProps) {
  const setBoardId = useSetAtom(boardIdAtom);
  const { createList, updateList, deleteList } = useListActions();
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

  const { mutate: updateCard } = useUpdateCard();
  const { mutate: deleteCard } = useDeleteCard();

  const { ref: scrollRef, ...dragEvents } = useDraggableScroll<HTMLDivElement>();

  // Auth0 user has 'sub' field for user ID
  const isOwner = currentUser?.sub === board?.userId;

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
    dataTransferData: string
  ) => {
    if (!boardId) return;

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
      await updateList(columnId, newName);
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

  return (
    <KanbanBoardProvider>
      <div
        className="p-4 w-full flex-1 flex flex-col overflow-hidden"
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
        <BoardHeaderBar
          boardId={boardId || ""}
          boardName={board.name}
          members={members}
          isOwner={isOwner}
          filters={filters}
          onFiltersChange={setFilters}
          onEditBoard={() => setIsEditBoardOpen(true)}
          progress={progress}
        />
        <KanbanBoard ref={scrollRef} {...dragEvents} className="max-h-[calc(95vh)] cursor-grab active:cursor-grabbing pb-48 flex-1 overflow-x-auto overflow-y-auto ">
          {filteredLists.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              boardId={boardId || ""}
              onDropOverColumn={(data) => handleDropOverColumn(column.id, data)}
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

        <CardEditDialog
          card={selectedCard}
          boardId={boardId || ""}
          isOpen={isCardDialogOpen}
          onClose={() => {
            setIsCardDialogOpen(false);
            setSelectedCard(null);
          }}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
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
  );
}
