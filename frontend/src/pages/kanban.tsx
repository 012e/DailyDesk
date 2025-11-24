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
  Loader,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useListActions } from "@/hooks/use-list";
import { useParams } from "react-router";
import { useBoard } from "@/hooks/use-board";
import BoardIdProivder from "@/components/board-id-provider";
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

export default function Kanban() {
  const { boardId } = useParams();

  // HEAD: Use hooks for data and actions
  const { createList } = useListActions();
  const board = useBoard({ boardId: boardId! });
  const lists = board.lists;

  // Main: UI State for dialogs and inputs
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
    // Drop logic to be implemented with hooks/backend
  };

  const handleDropOverListItem = (
    columnId: string,
    targetCardId: string,
    dataTransferData: string,
    dropDirection: KanbanBoardDropDirection,
  ) => {
    // Drop logic to be implemented with hooks/backend
  };

  const addCard = (columnId: string) => {
    // This needs to be connected to a useCardActions hook or similar
    console.log("Add card to column:", columnId);
  };

  const addColumn = () => {
    if (!newListTitle.trim()) return;

    createList({
      name: newListTitle,
    });
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
    // Implement updateList hook logic here
    setEditingListId(null);
    setEditingListTitle("");
  };

  const cancelColumnEdit = () => {
    setEditingListId(null);
    setEditingListTitle("");
  };

  const deleteColumn = (columnId: string) => {
    // Implement deleteList hook logic here
  };

  // Card editing functions
  const openCardDialog = (card: Card) => {
    // Convert local Card type to CardType for the Dialog
    const fullCard: CardType = {
      id: card.id,
      title: card.title,
      description: card.description,
      listId:
        lists.find((col) => col.cards.some((c) => c.id === card.id))?.id || "",
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
    // TODO: Connect this to a backend mutation/hook.
    // The logic below only worked when 'lists' was local state.
    // Since 'lists' now comes from useBoard(), you need an API call here.
    console.log("Update card:", updatedCard);

    setSelectedCard(updatedCard);
  };

  const handleDeleteCard = (cardId: string) => {
    // TODO: Connect this to a backend mutation/hook.
    console.log("Delete card:", cardId);

    setIsCardDialogOpen(false);
    setSelectedCard(null);
  };

  return (
    <BoardIdProivder>
      <KanbanBoardProvider>
        <div className="p-4 w-full h-full">
          <h2 className="text-lg tracking-tight">{board.name}</h2>
          <KanbanBoard>
            {lists.map((column) => (
              <KanbanBoardColumn
                key={column.id}
                columnId={column.id}
                onDropOverColumn={(data) =>
                  handleDropOverColumn(column.id, data)
                }
              >
                <KanbanBoardColumnHeader>
                  {editingListId === column.id ? (
                    <div className="flex gap-2 items-center w-full">
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
                        {/* {column.color && ( */}
                        {/* <KanbanColorCircle color={column.color} /> */}
                        {/* )} */}
                        {column.name}
                        <span className="ml-2 text-muted-foreground">
                          {/* {column.cards.length} */}
                        </span>
                      </KanbanBoardColumnTitle>
                      <div className="flex gap-1">
                        <KanbanBoardColumnIconButton
                          onClick={() =>
                            startEditingColumn(column.id, column.name)
                          }
                        >
                          <Edit2Icon className="size-3.5" />
                        </KanbanBoardColumnIconButton>
                        <KanbanBoardColumnIconButton
                          onClick={() => {
                            if (
                              confirm(
                                `Delete "${column.name}" list and all its cards?`,
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
                          direction,
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
                <div className="px-2 space-y-2">
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
                className="justify-start py-2 px-3 h-fit shrink-0"
                onClick={() => setIsAddingList(true)}
              >
                <PlusIcon className="mr-2 size-4" />
                Add List
              </Button>
            )}

            <KanbanBoardExtraMargin />
          </KanbanBoard>

          {/* Card Edit Dialog from origin/main */}
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
    </BoardIdProivder>
  );
}
