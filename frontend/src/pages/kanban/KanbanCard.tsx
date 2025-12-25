import {
  KanbanBoardCard,
  KanbanBoardCardDescription,
  KanbanBoardCardTitle,
  KanbanBoardColumnListItem,
  type KanbanBoardCircleColor,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Card as CardType, Label, Member, Attachment, Comment } from "@/types/card";
import { useAtom } from "jotai";
import { isCardDialogOpenAtom, selectedCardAtom } from "./atoms";

type NormalizedCard = CardType & {
  title: string;
  description?: string;
  color?: KanbanBoardCircleColor;
};

interface KanbanCardProps {
  card: {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    listId?: string;
    position?: number;
    order?: number;
    labels?: Label[];
    members?: Member[];
    dueDate?: Date;
    cover?: string;
    attachments?: Attachment[];
    comments?: Comment[];
    createdAt?: Date;
    updatedAt?: Date;
    color?: KanbanBoardCircleColor;
  };
  columnId: string;
  onDropOverListItem: (
    data: string,
    direction: KanbanBoardDropDirection
  ) => void;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({
  card,
  columnId,
  onDropOverListItem,
  onDelete,
}: KanbanCardProps) {
  const [, setSelectedCard] = useAtom(selectedCardAtom);
  const [, setIsCardDialogOpen] = useAtom(isCardDialogOpenAtom);

  // Normalize card to Card type for UI
  const normalizedCard: NormalizedCard = {
    id: card.id,
    title: card.title || card.name || "Untitled",
    description: card.description || "",
    listId: card.listId || columnId,
    position: card.position || card.order || 0,
    labels: card.labels || [],
    members: card.members || [],
    dueDate: card.dueDate,
    cover: card.cover,
    attachments: card.attachments || [],
    comments: card.comments || [],
    createdAt: card.createdAt || new Date(),
    updatedAt: card.updatedAt || new Date(),
    color: card.color,
  };

  const openCardDialog = () => {
    setSelectedCard(normalizedCard);
    setIsCardDialogOpen(true);
  };

  const handleDelete = () => {
    if (confirm("Delete this card?")) {
      onDelete(normalizedCard.id);
    }
  };

  return (
    <KanbanBoardColumnListItem
      key={normalizedCard.id}
      cardId={normalizedCard.id}
      onDropOverListItem={onDropOverListItem}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <KanbanBoardCard data={normalizedCard} onClick={openCardDialog}>
            <KanbanBoardCardTitle>{normalizedCard.title}</KanbanBoardCardTitle>
            {normalizedCard.description && (
              <KanbanBoardCardDescription>
                {normalizedCard.description}
              </KanbanBoardCardDescription>
            )}
          </KanbanBoardCard>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={openCardDialog}>Edit</ContextMenuItem>
          <ContextMenuItem onClick={handleDelete}>Remove</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </KanbanBoardColumnListItem>
  );
}
