import { CardEditDialog } from "@/components/card-edit-dialog";
import {
  KanbanBoard,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { useBoard, useUpdateBoard } from "@/hooks/use-board";
import { useUpdateCard } from "@/hooks/use-card";
import { useListActions } from "@/hooks/use-list";
import { useMembers } from "@/hooks/use-member";
import { useUploadImage } from "@/hooks/use-image";
import type { Card as CardType } from "@/types/card";
import { useAtom, useSetAtom } from "jotai";
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
  const { createList } = useListActions();
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
      if (filters.sortBy !== "none") {
        cards = [...cards].sort((a, b) => {
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
      }
      
      return { ...list, cards };
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

  const handleDropOverColumn = (columnId: string, dataTransferData: string) => {
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
      await createList({
        name: title,
      });
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleSaveColumnEdit = () => {
    // TODO: Implement updateList hook logic here
  };

  const handleDeleteColumn = async () => {
    // TODO: Implement deleteList hook logic here
  };

  const handleUpdateCard = (updatedCard: CardType) => {
    // TODO: Connect this to a backend mutation/hook.
    setSelectedCard(updatedCard);
  };

  const handleDeleteCard = () => {
    // TODO: Connect this to a backend mutation/hook.
    setIsCardDialogOpen(false);
    setSelectedCard(null);
  };

  return (
    <KanbanBoardProvider>
      <div className="p-4 w-full h-full">
        {/* Trello-style Header Bar */}
        <BoardHeaderBar
          boardId={boardId || ""}
          boardName={board.name}
          members={members}
          isOwner={isOwner}
          filters={filters}
          onFiltersChange={setFilters}
          onEditBoard={() => setIsEditBoardOpen(true)}
        />
        <KanbanBoard>
          {filteredLists.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onDropOverColumn={(data) => handleDropOverColumn(column.id, data)}
              onDropOverListItem={(targetCardId, data, direction) =>
                handleDropOverListItem(column.id, targetCardId, data, direction)
              }
              onSaveColumnEdit={handleSaveColumnEdit}
              onDeleteColumn={handleDeleteColumn}
              onDeleteCard={handleDeleteCard}
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
