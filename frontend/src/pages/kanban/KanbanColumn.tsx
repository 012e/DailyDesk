import {
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnList,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { useCreateCard } from "@/hooks/use-card";
import { useAtomValue } from "jotai";
import { AddCardForm } from "./AddCardForm";
import { boardIdAtom } from "./atoms";
import { ColumnHeader } from "./ColumnHeader";
import { KanbanCard } from "./KanbanCard";

interface Card {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  order?: number;
}

interface KanbanColumnProps {
  column: {
    id: string;
    name: string;
    cards: Card[];
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
  const boardId = useAtomValue(boardIdAtom);
  const { mutate: createCard } = useCreateCard();

  const handleAddCard = (columnId: string, title: string) => {
    if (!boardId) return;

    const nextOrder = column.cards.length;

    createCard({
      boardId: boardId,
      listId: columnId,
      name: title,
      order: nextOrder,
    });
  };

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

      <AddCardForm columnId={column.id} onAddCard={handleAddCard} />
    </KanbanBoardColumn>
  );
}
