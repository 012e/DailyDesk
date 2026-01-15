import {
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnList,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { AddCardForm } from "./AddCardForm";
import { ColumnHeader } from "./ColumnHeader";
import { KanbanCard } from "./KanbanCard";

// Backend card structure
interface BackendCard {
  id: string;
  name: string;
  order: number;
  listId: string;
  repeatFrequency?: "daily" | "weekly" | "monthly" | null;
  repeatInterval?: number | null;
}

interface KanbanColumnProps {
  column: {
    id: string;
    name: string;
    cards: BackendCard[];
  };
  boardId: string;
  onDropOverColumn: (data: string) => void;
  onDropOverListItem: (
    targetCardId: string,
    data: string,
    direction: KanbanBoardDropDirection
  ) => void;
  onSaveColumnEdit: (columnId: string, newName: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteCard: (cardId: string) => void;
  index: number;
}

export function KanbanColumn({
  column,
  boardId,
  onDropOverColumn,
  onDropOverListItem,
  onSaveColumnEdit,
  onDeleteColumn,
  onDeleteCard,
  index,
}: KanbanColumnProps) {
  return (
    <KanbanBoardColumn
      key={column.id}
      className="h-full"
      columnId={column.id}
      onDropOverColumn={onDropOverColumn}
      index={index}
    >
      <KanbanBoardColumnHeader>
        <ColumnHeader
          columnId={column.id}
          columnName={column.name}
          onSave={onSaveColumnEdit}
          onDelete={onDeleteColumn}
        />
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnList>
        {column.cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            columnId={column.id}
            boardId={boardId}
            onDropOverListItem={(data, direction) =>
              onDropOverListItem(card.id, data, direction)
            }
            onDelete={onDeleteCard}
          />
        ))}
      </KanbanBoardColumnList>

      <AddCardForm columnId={column.id} cardsCount={column.cards.length} />
    </KanbanBoardColumn>
  );
}
