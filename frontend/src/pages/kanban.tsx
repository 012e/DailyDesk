import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { useParams } from "react-router";
import EventCalendarPage from "@/components/comp-542";
import { Kanban } from "./kanban/Kanban";
import { useBoard } from "@/hooks/use-board";
import { useUpdateCard } from "@/hooks/use-card";
import { listsCardsToCalendarEvents } from "@/components/event-calendar";
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar";
import { toast } from "sonner";

export default function KanbanPage() {
  const { boardId } = useParams();
  const [page, setPage] = useState<"kanban" | "calendar">("kanban");
  
  // Get board data - always call the hook, but conditionally use the data
  const board = useBoard({ boardId: boardId || "" });
  const { mutate: updateCard } = useUpdateCard();
  
  // Convert cards to calendar events
  const calendarEvents = useMemo(() => {
    if (!boardId || !board?.lists) return [];
    return listsCardsToCalendarEvents(board.lists);
  }, [boardId, board?.lists]);

  // Handle event operations - now writable!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEventAdd = (_event: CalendarEvent) => {
    toast("Create cards in Kanban view to add events", {
      description: "Calendar events are automatically synced from cards with due dates",
      position: "bottom-left",
    });
  };

  // Update card deadline when event is moved
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    if (!boardId || !board?.lists) return;

    // Find the card that corresponds to this event
    let targetCard: { id: string; name: string; deadline?: Date | string | null } | null = null;
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

    // Update the card's deadline to match the new event end time
    updateCard(
      {
        boardId,
        cardId: targetCard.id,
        listId: targetListId,
        deadline: new Date(updatedEvent.end),
      },
      {
        onSuccess: () => {
          toast.success("Card deadline updated", {
            description: `Updated to ${new Date(updatedEvent.end).toLocaleString()}`,
            position: "bottom-left",
          });
        },
        onError: () => {
          toast.error("Failed to update card deadline");
        },
      }
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEventDelete = (_eventId: string) => {
    toast("Delete cards in Kanban view to remove events", {
      description: "Calendar events are automatically synced from cards",
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
