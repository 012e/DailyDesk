import {
  KanbanBoardColumnButton,
  KanbanBoardColumnFooter,
} from "@/components/kanban";
import { CardCreateDialog } from "@/components/card-edit-dialog/card-create-dialog";
import { PlusIcon } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { addingCardColumnIdAtom } from "./atoms";
import { boardIdAtom } from "./atoms";

interface AddCardFormProps {
  columnId: string;
  cardsCount: number;
}

export function AddCardForm({ columnId, cardsCount }: AddCardFormProps) {
  const [addingCardColumnId, setAddingCardColumnId] = useAtom(
    addingCardColumnIdAtom
  );
  const boardId = useAtomValue(boardIdAtom);

  const isDialogOpen = addingCardColumnId === columnId;

  const openDialog = () => {
    setAddingCardColumnId(columnId);
  };

  const closeDialog = () => {
    setAddingCardColumnId(null);
  };

  return (
    <>
      <KanbanBoardColumnFooter>
        <KanbanBoardColumnButton onClick={openDialog}>
          <PlusIcon className="mr-2 size-4" />
          Add Card
        </KanbanBoardColumnButton>
      </KanbanBoardColumnFooter>

      {boardId && (
        <CardCreateDialog
          boardId={boardId}
          listId={columnId}
          order={cardsCount}
          isOpen={isDialogOpen}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
