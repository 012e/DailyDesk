import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useParams } from "react-router";
import EventCalendarPage from "@/components/comp-542";
import { Kanban } from "./kanban/Kanban";

export default function KanbanPage() {
  const { boardId } = useParams();
  const [page, setPage] = useState<"kanban" | "calendar">("kanban");

  return (
    <div>
      {page === "kanban" && <Kanban boardId={boardId} />}{" "}
      {page === "calendar" && <EventCalendarPage />}
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
