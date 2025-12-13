import BoardIdProivder from "@/components/board-id-provider";
import { CardEditDialog } from "@/components/card-edit-dialog";
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
  KanbanCardCover,
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
import { useBoard } from "@/hooks/use-board";
import { useCreateCard, useUpdateCard } from "@/hooks/use-card";
import { useListActions } from "@/hooks/use-list";
import { CardCoverModeValue, type Card as CardType } from "@/types/card";
import {
  CheckIcon,
  Edit2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

export default function Kanban() {
  const { boardId } = useParams();

  // HEAD: Use hooks for data and actions
  const { createList } = useListActions();
  const board = useBoard({ boardId: boardId! });
  const [lists, setLists] = useState(board.lists);

  // Sync lists with board.lists when board changes
  useEffect(() => {
    setLists(board.lists);
  }, [board.lists]);

  // Main: UI State for dialogs and inputs
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState("");

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);

  const addListRef = useRef<HTMLDivElement>(null);

  // Track which column is adding a card and the input value
  const [addingCardColumnId, setAddingCardColumnId] = useState<string | null>(
    null
  );
  const [newCardTitle, setNewCardTitle] = useState("");
  const { mutate: createCard } = useCreateCard();
  const { mutate: updateCard } = useUpdateCard();

  // Log boardId for debugging
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
    if (!boardId) return;

    // dataTransferData is a JSON string of the card object
    let cardId: string;
    try {
      const cardData = JSON.parse(dataTransferData);
      cardId = cardData.id;
    } catch (e) {
      console.error("Failed to parse drag data:", e);
      return;
    }

    // Find the target list
    const targetList = lists.find((l) => l.id === columnId);
    if (!targetList) return;

    // Calculate the new order (append to end of target list)
    const newOrder = targetList.cards.length;

    // Update the card's listId and order
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

    // dataTransferData is a JSON string of the card object
    let draggedCardId: string;
    try {
      const cardData = JSON.parse(dataTransferData);
      draggedCardId = cardData.id;
    } catch (e) {
      console.error("Failed to parse drag data:", e);
      return;
    }

    // Don't do anything if dropping on itself
    if (draggedCardId === targetCardId) return;

    // Find the target list and cards
    const targetList = lists.find((l) => l.id === columnId);
    if (!targetList) return;

    // Find the target card's current order
    const targetCard = targetList.cards.find((c) => c.id === targetCardId);
    if (!targetCard) return;

    // Calculate new order based on drop direction
    let newOrder = targetCard.order || 0;
    if (dropDirection === "bottom") {
      newOrder += 1;
    }

    // Update the dragged card
    updateCard({
      boardId,
      cardId: draggedCardId,
      listId: columnId,
      order: newOrder,
    });
  };

  // Show input for adding a card in a column
  const startAddCard = (columnId: string) => {
    setAddingCardColumnId(columnId);
    setNewCardTitle("");
  };

  const handleAddCard = (columnId: string) => {
    if (!newCardTitle.trim() || !boardId) return;

    // Get the current list to calculate the next order
    const list = lists.find((l) => l.id === columnId);
    const nextOrder = list ? list.cards.length : 0;

    createCard({
      boardId: boardId,
      listId: columnId,
      name: newCardTitle,
      order: nextOrder,
    });

    setNewCardTitle("");
    setAddingCardColumnId(null);
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
  const openCardDialog = (card: any) => {
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
      coverUrl: card.coverUrl,
      coverColor: card.coverColor,
      order: card.order,
      coverMode: card.coverMode,
      attachments: card.attachments || [],
      comments: card.comments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedCard(fullCard);
    setIsCardDialogOpen(true);
  };

  const handleUpdateCard = async (updatedCard: CardType) => {
    // TODO: Connect this to a backend mutation/hook.
    // The logic below only worked when 'lists' was local state.
    // Since 'lists' now comes from useBoard(), you need an API call here.
    // Get the current list to calculate the next order
    if (!boardId) return;

    updateCard({
      boardId: boardId,
      cardId: updatedCard.id,
      name: updatedCard.title,
      listId: updatedCard.listId,
      coverColor: updatedCard.coverColor,
      isCover:
        updatedCard.coverMode === CardCoverModeValue.COVER ? true : false,
      order: updatedCard.order,
    });
    setSelectedCard(updatedCard);
  };

  const handleDeleteCard = (cardId: string) => {
    // TODO: Connect this to a backend mutation/hook.
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
                                `Delete "${column.name}" list and all its cards?`
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
                  {column.cards.map((card) => {
                    const c = card as any;
                    // Normalize card to Card type for UI
                    const normalizedCard = {
                      id: c.id,
                      title: c.title || c.name || "Untitled",
                      description: c.description || "",
                      listId: c.listId || column.id,
                      position: c.position || c.order || 0,
                      labels: c.labels || [],
                      members: c.members || [],
                      dueDate: c.dueDate,
                      coverUrl: c.coverUrl,
                      coverColor: c.CoverColor,
                      coverMode:
                        !c.coverUrl && !c.coverColor
                          ? CardCoverModeValue.NONE
                          : c.isCover
                          ? CardCoverModeValue.COVER
                          : CardCoverModeValue.TOP,
                      attachments: c.attachments || [],
                      comments: c.comments || [],
                      activities: c.activities || [],
                      createdAt: c.createdAt || new Date(),
                      updatedAt: c.updatedAt || new Date(),
                      color: c.color,
                    };
                    return (
                      <KanbanBoardColumnListItem
                        key={normalizedCard.id}
                        cardId={normalizedCard.id}
                        onDropOverListItem={(data, direction) =>
                          handleDropOverListItem(
                            column.id,
                            normalizedCard.id,
                            data,
                            direction
                          )
                        }
                      >
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <KanbanBoardCard
                              data={normalizedCard}
                              onClick={() => openCardDialog(normalizedCard)}
                            >
                              <KanbanCardCover
                                mode={normalizedCard.coverMode}
                                color={normalizedCard.coverColor}
                                imageUrl={normalizedCard.coverUrl}
                              />
                              <KanbanBoardCardTitle>
                                {/* If you want to show color, add KanbanColorCircle here if available */}
                                {normalizedCard.title}
                              </KanbanBoardCardTitle>
                              {normalizedCard.description && (
                                <KanbanBoardCardDescription>
                                  {normalizedCard.description}
                                </KanbanBoardCardDescription>
                              )}
                            </KanbanBoardCard>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              onClick={() => openCardDialog(normalizedCard)}
                            >
                              Edit
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => {
                                if (confirm("Delete this card?")) {
                                  handleDeleteCard(normalizedCard.id);
                                }
                              }}
                            >
                              Remove
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </KanbanBoardColumnListItem>
                    );
                  })}
                </KanbanBoardColumnList>

                <KanbanBoardColumnFooter>
                  {addingCardColumnId === column.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <Input
                        autoFocus
                        placeholder="Enter card title..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddCard(column.id);
                          if (e.key === "Escape") {
                            setAddingCardColumnId(null);
                            setNewCardTitle("");
                          }
                        }}
                        className="bg-background"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddCard(column.id)}
                          disabled={!newCardTitle.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAddingCardColumnId(null);
                            setNewCardTitle("");
                          }}
                          className="ml-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <KanbanBoardColumnButton
                      onClick={() => startAddCard(column.id)}
                    >
                      <PlusIcon className="mr-2 size-4" />
                      Add Card
                    </KanbanBoardColumnButton>
                  )}
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
            boardId={boardId || ""}
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
