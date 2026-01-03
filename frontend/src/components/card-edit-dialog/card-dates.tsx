import { useState } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Card } from "@/types/card";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface CardDatesProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function CardDates({ card, onUpdate, isOpen: controlledIsOpen, onOpenChange: controlledOnOpenChange, triggerButton }: CardDatesProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    card.dueDate
  );

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;

  const handleSave = () => {
    onUpdate({ dueDate: selectedDate });
    setIsOpen(false);
  };

  const handleRemove = () => {
    onUpdate({ dueDate: undefined });
    setSelectedDate(undefined);
    setIsOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Determine badge style based on due date status
  const getDueDateBadgeStyle = () => {
    if (!card.dueDate) return {};

    const dueDate = new Date(card.dueDate);

    if (isToday(dueDate)) {
      return {
        variant: "default" as const,
        className: "bg-yellow-500 hover:bg-yellow-600",
      };
    }

    if (isPast(dueDate)) {
      return {
        variant: "destructive" as const,
        className: "",
      };
    }

    return {
      variant: "secondary" as const,
      className: "",
    };
  };

  const badgeStyle = getDueDateBadgeStyle();

  // Popover content to be reused
  const popoverContent = (
    <div className="space-y-3 p-3">
      <div>
        <h4 className="font-semibold mb-1">Due Date</h4>
        <p className="text-xs text-muted-foreground">
          Set a due date to track when this card needs to be completed
        </p>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        initialFocus
      />

      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={handleSave} size="sm" className="flex-1">
          Save
        </Button>
        {card.dueDate && (
          <Button
            onClick={handleRemove}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Only show header and display if no custom trigger */}
      {!triggerButton && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Due Date</h3>
          </div>

          {/* Date display */}
          <div className="pl-7 flex items-center gap-2">
            {card.dueDate ? (
              <Badge
                variant={badgeStyle.variant}
                className={cn("group relative pr-6", badgeStyle.className)}
              >
                {format(new Date(card.dueDate), "MMM dd 'at' HH:mm")}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ) : null}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  {card.dueDate ? "Edit" : "Add"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {popoverContent}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Custom trigger version */}
      {triggerButton && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {popoverContent}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
