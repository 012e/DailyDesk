import { useQuery } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, Filter, Search, List, CalendarDays } from "lucide-react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getDueStatus } from "@/lib/due-status";
import { useUpdateCard } from "@/hooks/use-card";
import store from "@/stores/store";
import { accessTokenAtom } from "@/stores/access-token";

interface TaskCard {
  id: string;
  name: string;
  description: string | null;
  order: number;
  listId: string;
  listName: string;
  boardId: string;
  boardName: string;
  labels: Array<{ id: string; name: string; color: string }> | null;
  members: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    initials: string;
  }> | null;
  startDate: string | null;
  deadline: string | null;
  dueAt: string | null;
  dueComplete: boolean | null;
  reminderMinutes: number | null;
  recurrence: string | null;
  recurrenceDay: number | null;
  recurrenceWeekday: number | null;
  latitude: number | null;
  longitude: number | null;
  coverColor: string | null;
  coverUrl: string | null;
  coverPublicId: string | null;
  coverMode: string | null;
  completed: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function TasksPage() {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const { mutate: updateCard } = useUpdateCard();

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ["all-cards"],
    queryFn: async () => {
      try {
        // Try to get token from store first
        let accessToken = store.get(accessTokenAtom);
        
        // If no token in store, try to get it from Auth0
        if (!accessToken) {
          accessToken = await getAccessTokenSilently();
          if (accessToken) {
            store.set(accessTokenAtom, accessToken);
          }
        }
        
        if (!accessToken) {
          throw new Error("No access token available");
        }

        const response = await fetch("http://localhost:3000/boards/cards/all", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Fetch error:", response.status, errorText);
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }
        
        const data = await response.json();
        return data as TaskCard[];
      } catch (err) {
        console.error("Error in queryFn:", err);
        throw err;
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];

    const filtered = tasks.filter((task) => {
      // Search filter
      const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.boardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.listName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (filterStatus === "completed") return task.completed;
      if (filterStatus === "pending") return !task.completed;
      if (filterStatus === "overdue") {
        const dueStatus = getDueStatus(task.dueAt, task.dueComplete ?? undefined);
        return dueStatus.status === "overdue";
      }
      if (filterStatus === "today") {
        if (!task.dueAt) return false;
        const today = new Date();
        const dueDate = new Date(task.dueAt);
        return (
          dueDate.getDate() === today.getDate() &&
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getFullYear() === today.getFullYear()
        );
      }

      return true; // "all"
    });

    // Sort tasks
    filtered.sort((a, b) => {
      if (sortBy === "dueDate") {
        // Tasks with due dates first, then by date
        if (!a.dueAt && !b.dueAt) return 0;
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "board") {
        return a.boardName.localeCompare(b.boardName);
      }
      if (sortBy === "created") {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return filtered;
  }, [tasks, searchQuery, filterStatus, sortBy]);

  // Group tasks by board
  const tasksByBoard = useMemo(() => {
    if (!filteredAndSortedTasks) return new Map();
    
    const grouped = new Map<string, { boardName: string; tasks: TaskCard[] }>();
    
    filteredAndSortedTasks.forEach((task) => {
      if (!grouped.has(task.boardId)) {
        grouped.set(task.boardId, { boardName: task.boardName, tasks: [] });
      }
      grouped.get(task.boardId)!.tasks.push(task);
    });
    
    return grouped;
  }, [filteredAndSortedTasks]);

  // Transform tasks to calendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    if (!filteredAndSortedTasks) return [];
    
    return filteredAndSortedTasks
      .filter(task => task.dueAt || task.startDate) // Only show tasks with dates
      .map(task => {
        const startDate = task.startDate ? new Date(task.startDate) : new Date(task.dueAt!);
        const endDate = task.dueAt ? new Date(task.dueAt) : new Date(task.startDate!);
        
        // Determine color based on due status
        let color: CalendarEvent['color'] = 'sky';
        const dueStatus = getDueStatus(task.dueAt, task.dueComplete ?? undefined);
        if (task.completed) {
          color = 'emerald';
        } else if (dueStatus.status === 'overdue') {
          color = 'rose';
        } else if (dueStatus.status === 'dueSoon') {
          color = 'amber';
        }
        
        return {
          id: task.id,
          title: task.name,
          description: task.description || undefined,
          start: startDate,
          end: endDate,
          allDay: !task.startDate, // If no start date, treat as all-day
          color,
          labels: task.labels?.map(l => ({
            id: l.id,
            name: l.name,
            color: l.color,
          })),
          members: task.members || undefined,
          listId: task.listId,
        };
      });
  }, [filteredAndSortedTasks]);

  const handleToggleComplete = (task: TaskCard) => {
    updateCard(
      {
        boardId: task.boardId,
        cardId: task.id,
        completed: !task.completed,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Please log in to view tasks</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">All Tasks</h1>
            <p className="text-muted-foreground">
              View and manage all your tasks across all boards
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="board">Board</SelectItem>
            <SelectItem value="created">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Pending</div>
          <div className="text-2xl font-bold text-blue-600">
            {tasks?.filter((t) => !t.completed).length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Overdue</div>
          <div className="text-2xl font-bold text-red-600">
            {tasks?.filter((t) => {
              const dueStatus = getDueStatus(t.dueAt, t.dueComplete ?? undefined);
              return dueStatus.status === "overdue";
            }).length || 0}
          </div>
        </Card>
      </div>

      {/* Task List or Calendar View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading tasks...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-red-500">Error loading tasks</div>
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-lg text-muted-foreground mb-2">
              {searchQuery || filterStatus !== "all"
                ? "No tasks match your filters"
                : "No tasks yet"}
            </div>
            {!searchQuery && filterStatus === "all" && (
              <p className="text-sm text-muted-foreground">
                Create a board and add some tasks to get started
              </p>
            )}
          </div>
        </div>
      ) : viewMode === "calendar" ? (
        <div className="mb-6">
          <EventCalendar
            events={calendarEvents}
            initialView="month"
            className=""
          />
        </div>
      ) : (
        <div className="max-h-[calc(100vh-24rem)] overflow-auto  pr-2">
          <Accordion type="multiple" className="space-y-4">
            {Array.from(tasksByBoard.entries()).map(([boardId, { boardName, tasks: boardTasks }]) => {
            const completedCount = boardTasks.filter((t: TaskCard) => t.completed).length;
            const totalCount = boardTasks.length;

            return (
              <AccordionItem key={boardId} value={boardId} className="border-2 last:border-b-2 rounded-2xl px-4">
                <AccordionTrigger className="hover:no-underline p-5">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/board/${boardId}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        <h2 className="text-xl font-semibold">{boardName}</h2>
                      </Link>
                      <Badge variant="secondary" className="text-xs">
                        {completedCount}/{totalCount} card
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 last:mb-4">
                    <div className="space-y-4 pt-4">
                    {boardTasks.map((task: TaskCard, index: number) => {
                      const dueStatus = getDueStatus(task.dueAt, task.dueComplete ?? undefined);

                      return (
                        <Card
                          key={task.id}
                          className={`p-4 hover:shadow-md transition-shadow ${
                            task.completed ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <Checkbox
                              checked={task.completed || false}
                              onCheckedChange={() => handleToggleComplete(task)}
                              className="mt-1"
                            />

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <h3
                                    className={`font-semibold text-lg ${
                                      task.completed ? "line-through" : ""
                                    }`}
                                  >
                                    {task.name}
                                  </h3>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Labels */}
                              {task.labels && task.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {task.labels.map((label: { id: string; name: string; color: string }) => (
                                    <Badge
                                      key={label.id}
                                      style={{ backgroundColor: label.color }}
                                      className="text-white text-xs"
                                    >
                                      {label.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Meta information */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span>{task.listName}</span>
                                </div>

                                {task.dueAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <Badge
                                      variant={
                                        dueStatus.status === "overdue"
                                          ? "destructive"
                                          : dueStatus.status === "dueSoon"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {new Date(task.dueAt).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                )}

                                {task.dueComplete && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs">Due Complete</span>
                                  </div>
                                )}

                                {task.reminderMinutes && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs">
                                      Reminder: {task.reminderMinutes}m
                                    </span>
                                  </div>
                                )}

                                {/* Members */}
                                {task.members && task.members.length > 0 && (
                                  <div className="flex -space-x-2">
                                    {task.members.slice(0, 3).map((member: { id: string; name: string; initials: string }) => (
                                      <div
                                        key={member.id}
                                        className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-background"
                                        title={member.name}
                                      >
                                        {member.initials}
                                      </div>
                                    ))}
                                    {task.members.length > 3 && (
                                      <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs border-2 border-background">
                                        +{task.members.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
