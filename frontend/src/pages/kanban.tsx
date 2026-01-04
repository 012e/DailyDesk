import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { useParams } from "react-router";
import EventCalendarPage from "@/components/comp-542";
import { Kanban } from "./kanban/Kanban";
import { useBoard } from "@/hooks/use-board";
import { useUpdateCard, useCreateCard } from "@/hooks/use-card";
import { listsCardsToCalendarEvents } from "@/components/event-calendar";
import { EventCalendar, type CalendarEvent, type Label, type Member } from "@/components/event-calendar";
import { toast } from "sonner";

export default function KanbanPage() {
  const { boardId } = useParams();
  const [page, setPage] = useState<"kanban" | "calendar">("kanban");
  
  // Get board data - always call the hook, but conditionally use the data
  const board = useBoard({ boardId: boardId || "" });
  const { mutate: updateCard } = useUpdateCard();
  const { mutate: createCard } = useCreateCard();
  
  // Convert cards to calendar events
  const calendarEvents = useMemo(() => {
    if (!boardId || !board?.lists) return [];
    return listsCardsToCalendarEvents(board.lists);
  }, [boardId, board?.lists]);

  // Handle event operations - now writable!
  const handleEventAdd = (event: CalendarEvent) => {
    if (!boardId || !board?.lists || board.lists.length === 0) {
      toast.error("No lists available", {
        description: "Create a list first to add cards",
        position: "bottom-left",
      });
      return;
    }

    // Use the selected list or default to the first list
    const targetListId = event.listId || board.lists[0].id;
    const targetList = board.lists.find(l => l.id === targetListId) || board.lists[0];
    const nextOrder = targetList.cards.length;

    // Create a card from the event with labels and members
    createCard(
      {
        boardId,
        listId: targetList.id,
        name: event.title || "Untitled",
        description: event.description,
        deadline: new Date(event.end),
        order: nextOrder,
        labels: event.labels ? (event.labels as unknown as Label[]) : undefined,
        members: event.members ? (event.members as unknown as Member[]) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Card created from event", {
            description: `Added to ${targetList.name}`,
            position: "bottom-left",
          });
        },
        onError: () => {
          toast.error("Failed to create card from event");
        },
      }
    );
  };

  // Update card deadline when event is moved
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    if (!boardId || !board?.lists) return;

    // Find the card that corresponds to this event
    let targetCard: { id: string; name: string; deadline?: Date | string | null; description?: string | null } | null = null;
    let targetListId: string | null = null;

    for (const list of board.lists) {
      const card = list.cards.find((c) => c.id === updatedEvent.id);
      if (card) {
        targetCard = card;
        targetListId = list.id;
        break;
      }
    }

    if (!targetCard || !targetListId) {
      toast.error("Card not found");
      return;
    }

    // Update the card's properties from the event
    updateCard(
      {
        boardId,
        cardId: targetCard.id,
        listId: targetListId,
        name: updatedEvent.title || targetCard.name,
        description: updatedEvent.description !== undefined ? updatedEvent.description : (targetCard.description ?? undefined),
        deadline: new Date(updatedEvent.end),
        labels: updatedEvent.labels ? (updatedEvent.labels as unknown as Label[]) : undefined,
        members: updatedEvent.members ? (updatedEvent.members as unknown as Member[]) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Card updated from calendar", {
            description: `Deadline: ${new Date(updatedEvent.end).toLocaleString()}`,
            position: "bottom-left",
          });
        },
        onError: () => {
          toast.error("Failed to update card");
        },
      }
    );
  };

  const handleEventDelete = (_eventId: string) => {
    // For now, don't delete cards from calendar
    // Users should delete cards in Kanban view
    toast.info("Delete cards in Kanban view", {
      description: "Card deletion is available in the Kanban board",
      position: "bottom-left",
    });
  };

  return (
    <div>
      {page === "kanban" && <Kanban boardId={boardId} />}
      {page === "calendar" && boardId ? (
        <EventCalendar
          events={calendarEvents}
          onEventAdd={handleEventAdd}
          boardId={boardId}
          lists={board?.lists?.map(l => ({ id: l.id, title: l.name })) || []}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />
      ) : page === "calendar" && !boardId ? (
        <EventCalendarPage />
      ) : null}
      <PageTabs setPage={setPage} />
    </div>
  );
}

function PageTabs({
  setPage,
}: {
  setPage: (p: "kanban" | "calendar") => void;
}) {
  return (
    <div className="flex fixed right-0 left-0 bottom-5 z-50 justify-center items-center w-full">
      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" onClick={() => setPage("kanban")}>
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar" onClick={() => setPage("calendar")}>
            Calendar
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
