import { useState } from "react";
import { ArrowUpDown, X, ArrowUp, ArrowDown, Calendar, Type, Clock } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { SortOption } from "./board-filter-popover";

interface BoardSortPopoverProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  triggerClassName?: string;
}

const SORT_OPTIONS: { id: SortOption; label: string; icon: typeof ArrowUp; category: string }[] = [
  { id: "name-asc", label: "Name (A → Z)", icon: ArrowUp, category: "name" },
  { id: "name-desc", label: "Name (Z → A)", icon: ArrowDown, category: "name" },
  { id: "dueDate-asc", label: "Due Date (Earliest first)", icon: ArrowUp, category: "dueDate" },
  { id: "dueDate-desc", label: "Due Date (Latest first)", icon: ArrowDown, category: "dueDate" },
  { id: "createdAt-asc", label: "Order (Oldest first)", icon: ArrowUp, category: "createdAt" },
  { id: "createdAt-desc", label: "Order (Newest first)", icon: ArrowDown, category: "createdAt" },
];

export function BoardSortPopover({
  sortBy,
  onSortChange,
  triggerClassName,
}: BoardSortPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveSort = sortBy !== "none";
  const activeOption = SORT_OPTIONS.find((opt) => opt.id === sortBy);

  const clearSort = () => {
    onSortChange("none");
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
                hasActiveSort && "text-cyan-500 hover:text-cyan-600",
                triggerClassName
              )}
            >
              <ArrowUpDown className="h-4 w-4" />
              {hasActiveSort && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-500" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {hasActiveSort ? `Sorted by ${activeOption?.label}` : "Sort"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Sort Cards</h3>
          {hasActiveSort && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearSort}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="p-3 space-y-3">
          {/* By Name */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Type className="h-4 w-4" />
              <span>By Name</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SORT_OPTIONS.filter((opt) => opt.category === "name").map((option) => {
                const isSelected = sortBy === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                    onClick={() => onSortChange(option.id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{option.id === "name-asc" ? "A → Z" : "Z → A"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* By Due Date */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>By Due Date</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SORT_OPTIONS.filter((opt) => opt.category === "dueDate").map((option) => {
                const isSelected = sortBy === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                    onClick={() => onSortChange(option.id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{option.id === "dueDate-asc" ? "Earliest" : "Latest"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* By Order */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>By Order</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SORT_OPTIONS.filter((opt) => opt.category === "createdAt").map((option) => {
                const isSelected = sortBy === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                    onClick={() => onSortChange(option.id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{option.id === "createdAt-asc" ? "Oldest" : "Newest"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
