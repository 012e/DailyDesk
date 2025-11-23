import {
  KanbanBoard,
  KanbanBoardCard,
  KanbanBoardCardDescription,
  KanbanBoardCardTitle,
  KanbanBoardColumn,
  KanbanBoardColumnButton,
  kanbanBoardColumnClassNames,
  KanbanBoardColumnFooter,
  KanbanBoardColumnHeader,
  KanbanBoardColumnIconButton,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  KanbanBoardColumnTitle,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  KanbanColorCircle,
  type KanbanBoardCircleColor,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import {
  CheckIcon,
  Edit2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { CardEditDialog } from "@/components/card-edit-dialog";
import type { Card as CardType, Label, Member } from "@/types/card";

type Card = {
  id: string;
  title: string;
  description?: string;
  color?: KanbanBoardCircleColor;
  labels?: Label[];
  members?: Member[];
  dueDate?: Date;
  cover?: string;
  attachments?: any[];
  comments?: any[];
};

type Column = {
  id: string;
  title: string;
  color?: KanbanBoardCircleColor;
  cards: Card[];
};

const initialColumns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    color: "gray",
    cards: [
      {
        id: "0",
        title: "Research new features",
        description: "Investigate user feedback and feature requests",
        color: "indigo",
      },
    ],
  },
  {
    id: "todo",
    title: "To Do",
    color: "blue",
    cards: [
      {
        id: "1",
        title: "Design landing page",
        description: "Create mockups for the new landing page design",
        color: "blue",
      },
      {
        id: "2",
        title: "Set up database",
        description: "Configure PostgreSQL and create initial schema",
        color: "green",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "yellow",
    cards: [
      {
        id: "3",
        title: "Implement authentication",
        description: "Add user login and registration functionality",
        color: "purple",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "green",
    cards: [
      {
        id: "4",
        title: "Project setup",
        description: "Initialize repository and configure build tools",
        color: "cyan",
      },
    ],
  },
];

export default function Kanban() {
  const { boardId } = useParams<{ boardId: string }>();
  const [lists, setLists] = useState<Column[]>(initialColumns);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState("");

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);

  const addListRef = useRef<HTMLDivElement>(null);

  // Log boardId for debugging
  useEffect(() => {
    console.log("Current board ID:", boardId);
  }, [boardId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isAddingList &&
        addListRef.current &&
        !addListRef.current.contains(event.target as Node)
      ) {
        setIsAddingList(false);
        setNewListTitle("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddingList]);

  const handleDropOverColumn = (columnId: string, dataTransferData: string) => {
    const cardData = JSON.parse(dataTransferData) as Card;

    setLists((prevColumns) => {
      const newColumns = prevColumns.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => card.id !== cardData.id),
      }));

      const targetColumn = newColumns.find((col) => col.id === columnId);
      if (targetColumn) {
        targetColumn.cards.push(cardData);
      }

      return newColumns;
    });
  };

  const handleDropOverListItem = (
    columnId: string,
    targetCardId: string,
    dataTransferData: string,
    dropDirection: KanbanBoardDropDirection
  ) => {
    const cardData = JSON.parse(dataTransferData) as Card;

    setLists((prevColumns) => {
      const newColumns = prevColumns.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => card.id !== cardData.id),
      }));

      const targetColumn = newColumns.find((col) => col.id === columnId);
      if (targetColumn) {
        const targetIndex = targetColumn.cards.findIndex(
          (card) => card.id === targetCardId
        );
        const insertIndex =
          dropDirection === "top" ? targetIndex : targetIndex + 1;
        targetColumn.cards.splice(insertIndex, 0, cardData);
      }

      return newColumns;
    });
  };

  const addCard = (columnId: string) => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: "New Task",
      description: "Add description here...",
    };

    setLists((prevColumns) =>
      prevColumns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
      )
    );
  };

  const addColumn = () => {
    if (!newListTitle.trim()) return;

    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: newListTitle,
      color: "primary",
      cards: [],
    };

    setLists([...lists, newColumn]);
    setNewListTitle("");
    setIsAddingList(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addColumn();
    } else if (e.key === "Escape") {
      setIsAddingList(false);
      setNewListTitle("");
    }
  };

  // Column editing functions
  const startEditingColumn = (columnId: string, currentTitle: string) => {
    setEditingListId(columnId);
    setEditingListTitle(currentTitle);
  };

  const saveColumnEdit = () => {
    if (!editingListTitle.trim() || !editingListId) return;

    setLists((prevColumns) =>
      prevColumns.map((col) =>
        col.id === editingListId ? { ...col, title: editingListTitle } : col
      )
    );
    setEditingListId(null);
    setEditingListTitle("");
  };

  const cancelColumnEdit = () => {
    setEditingListId(null);
    setEditingListTitle("");
  };

  const deleteColumn = (columnId: string) => {
    setLists((prevColumns) => prevColumns.filter((col) => col.id !== columnId));
  };

  // Card editing functions
  const openCardDialog = (card: Card) => {
    // Convert local Card type to CardType
    const fullCard: CardType = {
      id: card.id,
      title: card.title,
      description: card.description,
      listId: lists.find((col) => col.cards.some((c) => c.id === card.id))?.id || "",
      position: 0,
      labels: card.labels || [],
      members: card.members || [],
      dueDate: card.dueDate,
      cover: card.cover,
      attachments: card.attachments || [],
      comments: card.comments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedCard(fullCard);
    setIsCardDialogOpen(true);
  };

  const handleUpdateCard = (updatedCard: CardType) => {
    setLists((prevColumns) =>
      prevColumns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === updatedCard.id
            ? {
                ...card,
                title: updatedCard.title,
                description: updatedCard.description,
                labels: updatedCard.labels,
                members: updatedCard.members,
                dueDate: updatedCard.dueDate,
                cover: updatedCard.cover,
                attachments: updatedCard.attachments,
                comments: updatedCard.comments,
              }
            : card
        ),
      }))
    );
    setSelectedCard(updatedCard);
  };

  const handleDeleteCard = (cardId: string) => {
    setLists((prevColumns) =>
      prevColumns.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => card.id !== cardId),
      }))
    );
    setIsCardDialogOpen(false);
    setSelectedCard(null);
  };

  return (
    <KanbanBoardProvider>
      <div className="h-full w-full p-4">
        <KanbanBoard>
          {lists.map((column) => (
            <KanbanBoardColumn
              key={column.id}
              columnId={column.id}
              onDropOverColumn={(data) => handleDropOverColumn(column.id, data)}
            >
              <KanbanBoardColumnHeader>
                {editingListId === column.id ? (
                  <div className="flex w-full items-center gap-2">
                    <Input
                      autoFocus
                      value={editingListTitle}
                      onChange={(e) => setEditingListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveColumnEdit();
                        if (e.key === "Escape") cancelColumnEdit();
                      }}
                      className="h-7 text-sm"
                    />
                    <KanbanBoardColumnIconButton
                      onClick={saveColumnEdit}
                      disabled={!editingListTitle.trim()}
                    >
                      <CheckIcon className="size-3.5" />
                    </KanbanBoardColumnIconButton>
                    <KanbanBoardColumnIconButton onClick={cancelColumnEdit}>
                      <XIcon className="size-3.5" />
                    </KanbanBoardColumnIconButton>
                  </div>
                ) : (
                  <>
                    <KanbanBoardColumnTitle columnId={column.id}>
                      {column.color && (
                        <KanbanColorCircle color={column.color} />
                      )}
                      {column.title}
                      <span className="ml-2 text-muted-foreground">
                        {column.cards.length}
                      </span>
                    </KanbanBoardColumnTitle>
                    <div className="flex gap-1">
                      <KanbanBoardColumnIconButton
                        onClick={() =>
                          startEditingColumn(column.id, column.title)
                        }
                      >
                        <Edit2Icon className="size-3.5" />
                      </KanbanBoardColumnIconButton>
                      <KanbanBoardColumnIconButton
                        onClick={() => {
                          if (
                            confirm(
                              `Delete "${column.title}" list and all its cards?`
                            )
                          ) {
                            deleteColumn(column.id);
                          }
                        }}
                      >
                        <Trash2Icon className="size-3.5" />
                      </KanbanBoardColumnIconButton>
                    </div>
                  </>
                )}
              </KanbanBoardColumnHeader>

              <KanbanBoardColumnList>
                {column.cards.map((card) => (
                  <KanbanBoardColumnListItem
                    key={card.id}
                    cardId={card.id}
                    onDropOverListItem={(data, direction) =>
                      handleDropOverListItem(
                        column.id,
                        card.id,
                        data,
                        direction
                      )
                    }
                  >
                    <ContextMenu>
                      <ContextMenuTrigger>
                        <KanbanBoardCard
                          data={card}
                          onClick={() => openCardDialog(card)}
                        >
                          <KanbanBoardCardTitle>
                            {card.color && (
                              <KanbanColorCircle color={card.color} />
                            )}
                            {card.title}
                          </KanbanBoardCardTitle>
                          {card.description && (
                            <KanbanBoardCardDescription>
                              {card.description}
                            </KanbanBoardCardDescription>
                          )}
                        </KanbanBoardCard>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => openCardDialog(card)}>
                          Edit
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            if (confirm("Delete this card?")) {
                              handleDeleteCard(card.id);
                            }
                          }}
                        >
                          Remove
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </KanbanBoardColumnListItem>
                ))}
              </KanbanBoardColumnList>

              <KanbanBoardColumnFooter>
                <KanbanBoardColumnButton onClick={() => addCard(column.id)}>
                  <PlusIcon className="mr-2 size-4" />
                  Add Card
                </KanbanBoardColumnButton>
              </KanbanBoardColumnFooter>
            </KanbanBoardColumn>
          ))}

          {/* Add New List Button/Form */}
          {isAddingList ? (
            <div ref={addListRef} className={kanbanBoardColumnClassNames}>
              <div className="space-y-2 px-2">
                <Input
                  autoFocus
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-background"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addColumn}
                    disabled={!newListTitle.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle("");
                    }}
                    className="ml-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="h-fit shrink-0 justify-start px-3 py-2"
              onClick={() => setIsAddingList(true)}
            >
              <PlusIcon className="mr-2 size-4" />
              Add List
            </Button>
          )}

          <KanbanBoardExtraMargin />
        </KanbanBoard>

        {/* Card Edit Dialog */}
        <CardEditDialog
          card={selectedCard}
          isOpen={isCardDialogOpen}
          onClose={() => {
            setIsCardDialogOpen(false);
            setSelectedCard(null);
          }}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
        />
      </div>
    </KanbanBoardProvider>
  );
}
