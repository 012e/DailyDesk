import { useState } from "react";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Card, RecurrenceType } from "@/types/card";
import { Badge } from "@/components/ui/badge";

interface CardRecurrenceProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];

export function CardRecurrence({
  card,
  onUpdate,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton,
}: CardRecurrenceProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    card.recurrence || "never"
  );
  const [recurrenceDay, setRecurrenceDay] = useState<number>(
    card.recurrenceDay || 2
  ); // Default to 2nd
  const [recurrenceWeekday, setRecurrenceWeekday] = useState<number>(
    card.recurrenceWeekday || 0
  ); // Default to Sunday

  // Use controlled state if provided, otherwise use internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;

  const handleSave = () => {
    if (recurrence === "never") {
      onUpdate({
        recurrence: "never",
        recurrenceDay: undefined,
        recurrenceWeekday: undefined,
      });
    } else if (recurrence === "monthly_day") {
      onUpdate({
        recurrence,
        recurrenceDay,
        recurrenceWeekday,
      });
    } else {
      onUpdate({
        recurrence,
        recurrenceDay: undefined,
        recurrenceWeekday: undefined,
      });
    }
    setIsOpen(false);
  };

  const getRecurrenceLabel = () => {
    if (!card.recurrence || card.recurrence === "never") return null;

    switch (card.recurrence) {
      case "daily_weekdays":
        return "Daily (Mon-Fri)";
      case "weekly":
        return "Weekly";
      case "monthly_date":
        return "Monthly on due date";
      case "monthly_day":
        if (card.recurrenceDay && card.recurrenceWeekday !== undefined) {
          return `Monthly on ${ORDINALS[card.recurrenceDay - 1]} ${
            WEEKDAYS[card.recurrenceWeekday]
          }`;
        }
        return "Monthly";
      default:
        return null;
    }
  };

  // Popover content to be reused
  const popoverContent = (
    <div className="space-y-3 p-3 w-80">
      <div>
        <h4 className="font-semibold mb-1">Recurrence</h4>
        <p className="text-xs text-muted-foreground">
          Set a recurring pattern for this card
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Repeat Pattern
          </label>
          <Select
            value={recurrence}
            onValueChange={(value) => setRecurrence(value as RecurrenceType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="daily_weekdays">Daily (Monday to Friday)</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly_date">Monthly on due date</SelectItem>
              <SelectItem value="monthly_day">Monthly on specific day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recurrence === "monthly_day" && (
          <div className="space-y-3 pt-2 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ordinal
              </label>
              <Select
                value={recurrenceDay.toString()}
                onValueChange={(value) => setRecurrenceDay(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ordinal" />
                </SelectTrigger>
                <SelectContent>
                  {ORDINALS.map((ordinal, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {ordinal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Day of Week
              </label>
              <Select
                value={recurrenceWeekday.toString()}
                onValueChange={(value) => setRecurrenceWeekday(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={handleSave} size="sm" className="flex-1">
          Save
        </Button>
        <Button
          onClick={() => setIsOpen(false)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  const recurrenceLabel = getRecurrenceLabel();

  return (
    <>
      {/* Only show header and display if no custom trigger */}
      {!triggerButton && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            <h3 className="font-semibold">Recurrence</h3>
          </div>

          {/* Recurrence display */}
          <div className="pl-7 flex items-center gap-2">
            {recurrenceLabel && (
              <Badge variant="outline" className="font-normal">
                {recurrenceLabel}
              </Badge>
            )}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  {recurrenceLabel ? "Edit" : "Add"}
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
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {popoverContent}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
