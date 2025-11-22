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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  CheckIcon,
  Edit2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { listLiveQuery as lists, useListActions } from "@/hooks/use-list";
import { useParams } from "react-router";

type Card = {
  id: string;
  title: string;
  description?: string;
  color?: KanbanBoardCircleColor;
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
  const { boardId } = useParams();

  const { createList } = useListActions(boardId!);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState("");

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardTitle, setEditingCardTitle] = useState("");
  const [editingCardDescription, setEditingCardDescription] = useState("");

  const addListRef = useRef<HTMLDivElement>(null);

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
    // const cardData = JSON.parse(dataTransferData) as Card;
    // setLists((prevColumns) => {
    //   const newColumns = prevColumns.map((col) => ({
    //     ...col,
    //     cards: col.cards.filter((card) => card.id !== cardData.id),
    //   }));
    //
    //   const targetColumn = newColumns.find((col) => col.id === columnId);
    //   if (targetColumn) {
    //     targetColumn.cards.push(cardData);
    //   }
    // return newColumns;
    // });
  };

  const handleDropOverListItem = (
    columnId: string,
    targetCardId: string,
    dataTransferData: string,
    dropDirection: KanbanBoardDropDirection,
  ) => {
    // const cardData = JSON.parse(dataTransferData) as Card;
    //
    // setLists((prevColumns) => {
    //   const newColumns = prevColumns.map((col) => ({
    //     ...col,
    //     cards: col.cards.filter((card) => card.id !== cardData.id),
    //   }));
    //
    //   const targetColumn = newColumns.find((col) => col.id === columnId);
    //   if (targetColumn) {
    //     const targetIndex = targetColumn.cards.findIndex(
    //       (card) => card.id === targetCardId,
    //     );
    //     const insertIndex =
    //       dropDirection === "top" ? targetIndex : targetIndex + 1;
    //     targetColumn.cards.splice(insertIndex, 0, cardData);
    //   }
    //
    //   return newColumns;
    // });
  };

  const addCard = (columnId: string) => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: "New Task",
      description: "Add description here...",
    };

    // setLists((prevColumns) =>
    //   prevColumns.map((col) =>
    //     col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col,
    //   ),
    // );
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
    // if (!editingListTitle.trim() || !editingListId) return;
    //
    // setLists((prevColumns) =>
    //   prevColumns.map((col) =>
    //     col.id === editingListId ? { ...col, title: editingListTitle } : col,
    //   ),
    // );
    // setEditingListId(null);
    // setEditingListTitle("");
  };

  const cancelColumnEdit = () => {
    setEditingListId(null);
    setEditingListTitle("");
  };

  const deleteColumn = (columnId: string) => {
    // setLists((prevColumns) => prevColumns.filter((col) => col.id !== columnId));
  };

  // Card editing functions
  const startEditingCard = (card: Card) => {
    setEditingCardId(card.id);
    setEditingCardTitle(card.title);
    setEditingCardDescription(card.description || "");
  };

  const saveChanges = () => {
    if (!editingCardId) return;

    // setLists((prevColumns) =>
    //   prevColumns.map((col) => ({
    //     ...col,
    //     cards: col.cards.map((card) =>
    //       card.id === editingCardId
    //         ? {
    //             ...card,
    //             title: editingCardTitle,
    //             description: editingCardDescription,
    //           }
    //         : card,
    //     ),
    //   })),
    // );

    setEditingCardId(null);
    setEditingCardTitle("");
    setEditingCardDescription("");
  };

  return (
    <KanbanBoardProvider>
      <div className="p-4 w-full h-full">
        <KanbanBoard>
          {lists.map((column) => (
            <KanbanBoardColumn
              key={column.id}
              columnId={column.id}
              onDropOverColumn={(data) => handleDropOverColumn(column.id, data)}
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
                      {/*   <KanbanColorCircle color={column.color} /> */}
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <KanbanBoardCard
                              data={card}
                              onClick={() => startEditingCard(card)}
                            >
                              <KanbanBoardCardTitle>
                                {/* {card.color && ( */}
                                {/*   <KanbanColorCircle color={card.color} /> */}
                                {/* )} */}
                                {card.title}
                              </KanbanBoardCardTitle>
                              {card.description && (
                                <KanbanBoardCardDescription>
                                  {card.description}
                                </KanbanBoardCardDescription>
                              )}
                            </KanbanBoardCard>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Card</DialogTitle>
                              <DialogDescription>
                                Make changes to your card here. Click save when
                                you&apos;re done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4">
                              <div className="grid gap-3">
                                <Label htmlFor="card-id">Title</Label>
                                <Input
                                  id={editingCardId || "card-id"}
                                  name="title"
                                  value={editingCardTitle}
                                  onChange={(e) =>
                                    setEditingCardTitle(e.target.value)
                                  }
                                />
                              </div>
                              <div className="grid gap-3">
                                <Label htmlFor="description-1">
                                  Description
                                </Label>
                                <Input
                                  id="description-1"
                                  name="description"
                                  value={editingCardDescription}
                                  onChange={(e) =>
                                    setEditingCardDescription(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button onClick={saveChanges}>
                                  Save changes
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem>Edit</ContextMenuItem>
                        <ContextMenuItem>Remove</ContextMenuItem>
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
      </div>
    </KanbanBoardProvider>
  );
}
