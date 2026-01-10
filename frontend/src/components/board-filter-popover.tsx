import { useState } from "react";
import { Filter, X, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLabels } from "@/hooks/use-label";
import { useMembers } from "@/hooks/use-member";
import { cn } from "@/lib/utils";

export type SortOption = "none" | "name-asc" | "name-desc" | "dueDate-asc" | "dueDate-desc" | "createdAt-asc" | "createdAt-desc";

export interface FilterState {
  labels: string[];
  members: string[];
  dueDate: ("overdue" | "dueSoon" | "noDueDate" | "notOverdue")[];
  searchQuery: string;
  sortBy: SortOption;
}

export const emptyFilterState: FilterState = {
  labels: [],
  members: [],
  dueDate: [],
  searchQuery: "",
  sortBy: "none",
};

interface BoardFilterPopoverProps {
  boardId: string;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  triggerClassName?: string;
}

export function BoardFilterPopover({
  boardId,
  filters,
  onFiltersChange,
  triggerClassName,
}: BoardFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: labels = [] } = useLabels(boardId);
  const { data: members = [] } = useMembers(boardId);

  const hasActiveFilters =
    filters.labels.length > 0 ||
    filters.members.length > 0 ||
    filters.dueDate.length > 0;

  const activeFilterCount =
    filters.labels.length + filters.members.length + filters.dueDate.length;

  const toggleLabel = (labelId: string) => {
    const newLabels = filters.labels.includes(labelId)
      ? filters.labels.filter((id) => id !== labelId)
      : [...filters.labels, labelId];
    onFiltersChange({ ...filters, labels: newLabels });
  };

  const toggleMember = (memberId: string) => {
    const newMembers = filters.members.includes(memberId)
      ? filters.members.filter((id) => id !== memberId)
      : [...filters.members, memberId];
    onFiltersChange({ ...filters, members: newMembers });
  };

  const toggleDueDate = (type: "overdue" | "dueSoon" | "noDueDate" | "notOverdue") => {
    const newDueDate = filters.dueDate.includes(type)
      ? filters.dueDate.filter((t) => t !== type)
      : [...filters.dueDate, type];
    onFiltersChange({ ...filters, dueDate: newDueDate });
  };

  const clearFilters = () => {
    onFiltersChange(emptyFilterState);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-muted relative",
                hasActiveFilters && "text-cyan-500 hover:text-cyan-600",
                triggerClassName
              )}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-cyan-500 text-[10px] font-medium text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {hasActiveFilters ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'Filter'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Filter Cards</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="p-3 space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent hover:scrollbar-thumb-gray-400/70">
          {/* Labels Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>Labels</span>
            </div>
            {labels.length > 0 ? (
              <div className="space-y-1">
                {labels.map((label) => {
                  const isSelected = filters.labels.includes(label.id);
                  return (
                    <div
                      key={label.id}
                      className={cn(
                        "flex items-center gap-2.5 cursor-pointer rounded-md p-1.5 -mx-1 transition-colors",
                        isSelected 
                          ? "bg-primary/10 hover:bg-primary/15" 
                          : "hover:bg-accent"
                      )}
                      onClick={() => toggleLabel(label.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                      <div
                        className="h-6 flex-1 rounded px-3 flex items-center"
                        style={{ backgroundColor: label.color }}
                      >
                        <span className="text-white text-xs font-medium truncate">
                          {label.name || "Untitled"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No labels available</p>
            )}
          </div>

          <Separator />

          {/* Members Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Members</span>
            </div>
            {members.length > 0 ? (
              <div className="space-y-1">
                {members.map((member, index) => {
                  const colors = [
                    "bg-blue-500",
                    "bg-yellow-500",
                    "bg-orange-500",
                    "bg-red-500",
                    "bg-purple-500",
                    "bg-green-500",
                    "bg-pink-500",
                    "bg-cyan-500",
                  ];
                  const colorClass = colors[index % colors.length];
                  const initials = member.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?";
                  const isSelected = filters.members.includes(member.id);
                  
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center gap-2.5 cursor-pointer rounded-md p-1.5 -mx-1 transition-colors",
                        isSelected 
                          ? "bg-primary/10 hover:bg-primary/15" 
                          : "hover:bg-accent"
                      )}
                      onClick={() => toggleMember(member.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`h-7 w-7 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-semibold`}>
                            {initials}
                          </div>
                        )}
                        <span className="text-sm truncate">{member.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No members available</p>
            )}
          </div>

          <Separator />

          {/* Due Date Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due Date</span>
            </div>
            <div className="space-y-1.5">
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-1 -m-1"
                onClick={() => toggleDueDate("overdue")}
              >
                <Checkbox
                  checked={filters.dueDate.includes("overdue")}
                  className="pointer-events-none"
                />
                <span className="text-sm text-red-500">Overdue</span>
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-1 -m-1"
                onClick={() => toggleDueDate("dueSoon")}
              >
                <Checkbox
                  checked={filters.dueDate.includes("dueSoon")}
                  className="pointer-events-none"
                />
                <span className="text-sm text-yellow-500">Due soon (24h)</span>
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-1 -m-1"
                onClick={() => toggleDueDate("notOverdue")}
              >
                <Checkbox
                  checked={filters.dueDate.includes("notOverdue")}
                  className="pointer-events-none"
                />
                <span className="text-sm text-green-500">Not overdue</span>
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-1 -m-1"
                onClick={() => toggleDueDate("noDueDate")}
              >
                <Checkbox
                  checked={filters.dueDate.includes("noDueDate")}
                  className="pointer-events-none"
                />
                <span className="text-sm">No due date</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Utility function to check if a card matches the filters
export function cardMatchesFilters(
  card: {
    labels?: { id: string }[] | null;
    members?: { id: string }[] | null;
    deadline?: Date | string | null;
  },
  filters: FilterState
): boolean {
  // If no filters are active, show all cards
  if (
    filters.labels.length === 0 &&
    filters.members.length === 0 &&
    filters.dueDate.length === 0
  ) {
    return true;
  }

  // Check label filter
  if (filters.labels.length > 0) {
    const cardLabelIds = card.labels?.map((l) => l.id) ?? [];
    const hasMatchingLabel = filters.labels.some((labelId) =>
      cardLabelIds.includes(labelId)
    );
    if (!hasMatchingLabel) return false;
  }

  // Check member filter
  if (filters.members.length > 0) {
    const cardMemberIds = card.members?.map((m) => m.id) ?? [];
    const hasMatchingMember = filters.members.some((memberId) =>
      cardMemberIds.includes(memberId)
    );
    if (!hasMatchingMember) return false;
  }

  // Check due date filter
  if (filters.dueDate.length > 0) {
    const deadline = card.deadline ? new Date(card.deadline) : null;
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let matchesDueDate = false;
    
    for (const dueDateFilter of filters.dueDate) {
      if (dueDateFilter === "overdue" && deadline && deadline < now) {
        matchesDueDate = true;
        break;
      }
      if (dueDateFilter === "dueSoon" && deadline && deadline >= now && deadline <= in24Hours) {
        matchesDueDate = true;
        break;
      }
      if (dueDateFilter === "noDueDate" && !deadline) {
        matchesDueDate = true;
        break;
      }
      if (dueDateFilter === "notOverdue" && deadline && deadline >= now) {
        matchesDueDate = true;
        break;
      }
    }

    if (!matchesDueDate) return false;
  }

  return true;
}
