import { CardEditDialog } from "@/components/card-edit-dialog";
import {
  KanbanBoard,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { useBoard } from "@/hooks/use-board";
import { useUpdateCard } from "@/hooks/use-card";
import { useListActions } from "@/hooks/use-list";
import type { Card as CardType } from "@/types/card";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { AddListForm } from "./AddListForm";
import {
  boardIdAtom,
  isCardDialogOpenAtom,
  selectedCardAtom,
} from "./atoms";
import { KanbanColumn } from "./KanbanColumn";
import { BoardMembersManager } from "@/components/board-members-manager";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Users } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

interface KanbanProps {
  boardId?: string;
}

export function Kanban({ boardId }: KanbanProps) {
  const setBoardId = useSetAtom(boardIdAtom);
  const { createList } = useListActions();
  const board = useBoard({ boardId: boardId! });
  const lists = board?.lists || [];
  const { user: currentUser } = useAuth0();

  const [selectedCard, setSelectedCard] = useAtom(selectedCardAtom);
  const [isCardDialogOpen, setIsCardDialogOpen] = useAtom(isCardDialogOpenAtom);
  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);

  const { mutate: updateCard } = useUpdateCard();

  // Auth0 user has 'sub' field for user ID
  const isOwner = currentUser?.sub === board?.userId;

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg tracking-tight">{board.name}</h2>
          <Sheet open={isMembersSheetOpen} onOpenChange={setIsMembersSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Quản lý thành viên
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Quản lý thành viên Board</SheetTitle>
                <SheetDescription>
                  Thêm hoặc xóa thành viên khỏi board {board.name}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <BoardMembersManager
                  boardId={boardId!}
                  isOwner={isOwner}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <KanbanBoard>
          {lists.map((column) => (
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
          isOpen={isCardDialogOpen}
          onClose={() => {
            setIsCardDialogOpen(false);
            setSelectedCard(null);
          }}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          boardId={boardId}
        />
      </div>
    </KanbanBoardProvider>
  );
}
