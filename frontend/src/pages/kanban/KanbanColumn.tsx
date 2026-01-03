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
}

interface KanbanColumnProps {
  column: {
    id: string;
    name: string;
    cards: BackendCard[];
  };
  onDropOverColumn: (data: string) => void;
  onDropOverListItem: (
    targetCardId: string,
    data: string,
    direction: KanbanBoardDropDirection
  ) => void;
  onSaveColumnEdit: () => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export function KanbanColumn({
  column,
  onDropOverColumn,
  onDropOverListItem,
  onSaveColumnEdit,
  onDeleteColumn,
  onDeleteCard,
}: KanbanColumnProps) {
  return (
    <KanbanBoardColumn
      key={column.id}
      columnId={column.id}
      onDropOverColumn={onDropOverColumn}
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

