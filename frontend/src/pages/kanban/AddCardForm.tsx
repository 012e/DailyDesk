import {
  KanbanBoardColumnButton,
  KanbanBoardColumnFooter,
} from "@/components/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { useAtom } from "jotai";
import { addingCardColumnIdAtom, newCardTitleAtom } from "./atoms";

interface AddCardFormProps {
  columnId: string;
  onAddCard: (columnId: string, title: string) => void;
}

export function AddCardForm({ columnId, onAddCard }: AddCardFormProps) {
  const [addingCardColumnId, setAddingCardColumnId] = useAtom(
    addingCardColumnIdAtom
  );
  const [newCardTitle, setNewCardTitle] = useAtom(newCardTitleAtom);

  const isAdding = addingCardColumnId === columnId;

  const startAdding = () => {
    setAddingCardColumnId(columnId);
    setNewCardTitle("");
  };

  const cancelAdding = () => {
    setAddingCardColumnId(null);
    setNewCardTitle("");
  };

  const handleAdd = () => {
    if (newCardTitle.trim()) {
      onAddCard(columnId, newCardTitle);
      cancelAdding();
    }
  };

  return (
    <KanbanBoardColumnFooter>
      {isAdding ? (
        <div className="flex flex-col gap-2 w-full">
          <Input
            autoFocus
            placeholder="Enter card title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") cancelAdding();
            }}
            className="bg-background"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newCardTitle.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelAdding}
              className="ml-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <KanbanBoardColumnButton onClick={startAdding}>
          <PlusIcon className="mr-2 size-4" />
          Add Card
        </KanbanBoardColumnButton>
      )}
    </KanbanBoardColumnFooter>
  );
}
