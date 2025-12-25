import {
  KanbanBoardColumnIconButton,
  KanbanBoardColumnTitle,
} from "@/components/kanban";
import { Input } from "@/components/ui/input";
import { CheckIcon, Edit2Icon, Trash2Icon, XIcon } from "lucide-react";
import { useAtom } from "jotai";
import { editingListIdAtom, editingListTitleAtom } from "./atoms";

interface ColumnHeaderProps {
  columnId: string;
  columnName: string;
  onSave: () => void;
  onDelete: (columnId: string) => void;
}

export function ColumnHeader({
  columnId,
  columnName,
  onSave,
  onDelete,
}: ColumnHeaderProps) {
  const [editingListId, setEditingListId] = useAtom(editingListIdAtom);
  const [editingListTitle, setEditingListTitle] = useAtom(editingListTitleAtom);

  const isEditing = editingListId === columnId;

  const startEditing = () => {
    setEditingListId(columnId);
    setEditingListTitle(columnName);
  };

  const cancelEdit = () => {
    setEditingListId(null);
    setEditingListTitle("");
  };

  const handleSave = () => {
    onSave();
    cancelEdit();
  };

  const handleDelete = () => {
    if (confirm(`Delete "${columnName}" list and all its cards?`)) {
      onDelete(columnId);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 items-center w-full">
        <Input
          autoFocus
          value={editingListTitle}
          onChange={(e) => setEditingListTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") cancelEdit();
          }}
          className="h-7 text-sm"
        />
        <KanbanBoardColumnIconButton
          onClick={handleSave}
          disabled={!editingListTitle.trim()}
        >
          <CheckIcon className="size-3.5" />
        </KanbanBoardColumnIconButton>
        <KanbanBoardColumnIconButton onClick={cancelEdit}>
          <XIcon className="size-3.5" />
        </KanbanBoardColumnIconButton>
      </div>
    );
  }

  return (
    <>
      <KanbanBoardColumnTitle columnId={columnId}>
        {columnName}
        <span className="ml-2 text-muted-foreground">
          {/* {column.cards.length} */}
        </span>
      </KanbanBoardColumnTitle>
      <div className="flex gap-1">
        <KanbanBoardColumnIconButton onClick={startEditing}>
          <Edit2Icon className="size-3.5" />
        </KanbanBoardColumnIconButton>
        <KanbanBoardColumnIconButton onClick={handleDelete}>
          <Trash2Icon className="size-3.5" />
        </KanbanBoardColumnIconButton>
      </div>
    </>
  );
}
