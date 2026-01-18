import { useState, useEffect } from "react";
import { Clock, X, CheckCircle2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import type { Card, RepeatFrequency } from "@/types/card";
import { cn } from "@/lib/utils";
import { getDueStatus, formatDueDate, REMINDER_OPTIONS } from "@/lib/due-status";
import { useUpdateDue, useClearDue } from "@/hooks/use-due";
import { toast } from "react-hot-toast";

interface CardDatesProps {
  card: Card;
  boardId?: string;
  onUpdate: (updates: Partial<Card>) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
  createMode?: boolean;
}

export function CardDates({
  card,
  boardId,
  onUpdate,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton,
  createMode = false,
}: CardDatesProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Start Date state
  const [startDate, setStartDate] = useState<Date | undefined>(
    card.startDate ? new Date(card.startDate) : undefined
  );
  const [startTime, setStartTime] = useState<string>(() => {
    if (card.startDate) {
      const date = new Date(card.startDate);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "09:00";
  });

  // Due Date state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    card.dueAt ? new Date(card.dueAt) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (card.dueAt) {
      const date = new Date(card.dueAt);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "17:00";
  });

  const [isDueComplete, setIsDueComplete] = useState(card.dueComplete || false);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(card.reminderMinutes ?? null);

  // Repeat state
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(!!card.repeatFrequency);
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>(card.repeatFrequency || "weekly");
  const [repeatInterval, setRepeatInterval] = useState(card.repeatInterval || 1);

  // Checkboxes to enable/disable dates
  const [isStartDateEnabled, setIsStartDateEnabled] = useState(!!startDate);
  const [isDueDateEnabled, setIsDueDateEnabled] = useState(!!selectedDate);

  // Checkbox to enable/disable time for both dates
  // Initialize based on whether card has time set (not 00:00:00)
  const [isTimeEnabled, setIsTimeEnabled] = useState(() => {
    if (card.startDate) {
      const date = new Date(card.startDate);
      if (date.getHours() !== 0 || date.getMinutes() !== 0) return true;
    }
    if (card.dueAt) {
      const date = new Date(card.dueAt);
      if (date.getHours() !== 0 || date.getMinutes() !== 0) return true;
    }
    return false;
  });

  const updateDueMutation = useUpdateDue();
  const clearDueMutation = useClearDue();

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;

  useEffect(() => {
    // Sync Start Date
    if (card.startDate) {
      setStartDate(new Date(card.startDate));
      const date = new Date(card.startDate);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      setStartTime(`${hours}:${minutes}`);
      setIsStartDateEnabled(true);
    } else {
      setStartDate(undefined);
      setStartTime("09:00");
      setIsStartDateEnabled(false);
    }

    // Sync Due Date
    if (card.dueAt) {
      setSelectedDate(new Date(card.dueAt));
      const date = new Date(card.dueAt);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      setSelectedTime(`${hours}:${minutes}`);
      setIsDueDateEnabled(true);
    } else {
      setSelectedDate(undefined);
      setSelectedTime("17:00");
      setIsDueDateEnabled(false);
    }

    // Sync time enabled state based on whether dates have time set
    let hasTime = false;
    if (card.startDate) {
      const date = new Date(card.startDate);
      if (date.getHours() !== 0 || date.getMinutes() !== 0) hasTime = true;
    }
    if (card.dueAt) {
      const date = new Date(card.dueAt);
      if (date.getHours() !== 0 || date.getMinutes() !== 0) hasTime = true;
    }
    setIsTimeEnabled(hasTime);

    setIsDueComplete(card.dueComplete || false);
    setReminderMinutes(card.reminderMinutes ?? null);

    // Sync repeat
    setIsRepeatEnabled(!!card.repeatFrequency);
    setRepeatFrequency(card.repeatFrequency || "weekly");
    setRepeatInterval(card.repeatInterval || 1);
  }, [card.startDate, card.dueAt, card.dueComplete, card.reminderMinutes, card.repeatFrequency, card.repeatInterval]);

  const handleSave = async () => {
    // Prepare start date time
    let startDateTime: Date | null = null;
    if (startDate) {
      startDateTime = new Date(startDate);
      if (isTimeEnabled) {
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        startDateTime.setHours(startHours, startMinutes, 0, 0);
      } else {
        startDateTime.setHours(0, 0, 0, 0);
      }
    }

    // Prepare due date time
    let dueDateTime: Date | null = null;
    if (selectedDate) {
      dueDateTime = new Date(selectedDate);
      if (isTimeEnabled) {
        const [dueHours, dueMinutes] = selectedTime.split(":").map(Number);
        dueDateTime.setHours(dueHours, dueMinutes, 0, 0);
      } else {
        dueDateTime.setHours(0, 0, 0, 0);
      }
    }

    if (createMode) {
      onUpdate({
        startDate: startDateTime,
        dueAt: dueDateTime,
        dueComplete: isDueComplete,
        reminderMinutes,
        repeatFrequency: isRepeatEnabled ? repeatFrequency : null,
        repeatInterval: isRepeatEnabled ? repeatInterval : null,
      });
      setIsOpen(false);
      return;
    }

    if (!boardId) {
      toast.error("Board ID is required");
      return;
    }

    try {
      // Update dates via API
      await updateDueMutation.mutateAsync({
        boardId,
        cardId: card.id,
        startDate: startDateTime ? startDateTime.toISOString() : null,
        dueAt: dueDateTime ? dueDateTime.toISOString() : null,
        dueComplete: isDueComplete,
        reminderMinutes,
        repeatFrequency: isRepeatEnabled ? repeatFrequency : null,
        repeatInterval: isRepeatEnabled ? repeatInterval : null,
      });

      // Update parent component state
      onUpdate({
        startDate: startDateTime,
        dueAt: dueDateTime,
        dueComplete: isDueComplete,
        reminderMinutes,
        repeatFrequency: isRepeatEnabled ? repeatFrequency : null,
        repeatInterval: isRepeatEnabled ? repeatInterval : null,
      });

      toast.success("Dates updated");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to update dates");
      console.error("❌ Update dates error:", error);
    }
  };

  const handleRemove = async () => {
    if (createMode) {
      onUpdate({
        startDate: null,
        dueAt: null,
        dueComplete: false,
        reminderMinutes: null,
        repeatFrequency: null,
        repeatInterval: null,
      });

      setStartDate(undefined);
      setStartTime("09:00");
      setSelectedDate(undefined);
      setSelectedTime("17:00");
      setIsDueComplete(false);
      setReminderMinutes(null);
      setIsRepeatEnabled(false);
      setRepeatFrequency("weekly");
      setRepeatInterval(1);
      setIsOpen(false);
      return;
    }

    if (!boardId) {
      toast.error("Board ID is required");
      return;
    }

    try {
      await clearDueMutation.mutateAsync({
        boardId,
        cardId: card.id,
      });

      onUpdate({
        startDate: null,
        dueAt: null,
        dueComplete: false,
        reminderMinutes: null,
        repeatFrequency: null,
        repeatInterval: null,
      });

      setStartDate(undefined);
      setStartTime("09:00");
      setSelectedDate(undefined);
      setSelectedTime("17:00");
      setIsDueComplete(false);
      setReminderMinutes(null);
      setIsRepeatEnabled(false);
      setRepeatFrequency("weekly");
      setRepeatInterval(1);

      toast.success("Dates removed");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to remove dates");
      console.error(error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(date);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate: due date cannot be before today
    if (date < today) {
      toast.error("Due date cannot be before today");
      return;
    }

    // Validate: due date cannot be before start date
    if (startDate) {
      const startDateOnly = new Date(startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      if (date < startDateOnly) {
        toast.error("Due date cannot be before start date");
        return;
      }
    }

    setSelectedDate(date);
  };

  const handleToggleComplete = async () => {
    if (!card.dueAt) return;

    const newCompleteStatus = !isDueComplete;
    setIsDueComplete(newCompleteStatus);

    if (createMode) {
      onUpdate({ dueComplete: newCompleteStatus });
      return;
    }

    if (!boardId) {
      setIsDueComplete(!newCompleteStatus);
      toast.error("Board ID is required");
      return;
    }

    try {
      await updateDueMutation.mutateAsync({
        boardId,
        cardId: card.id,
        dueComplete: newCompleteStatus,
      });

      onUpdate({ dueComplete: newCompleteStatus });
      toast.success(newCompleteStatus ? "Marked as complete" : "Marked as incomplete");
    } catch (error) {
      setIsDueComplete(!newCompleteStatus);
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const { label, color } = getDueStatus(card.dueAt, card.dueComplete);
  const formattedDate = formatDueDate(card.dueAt);

  const getBadgeClassName = () => {
    switch (color) {
      case "success":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200";
      case "destructive":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200";
      case "secondary":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "";
    }
  };

  const getDisabledDatesForPopover = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate) {
      const startDateOnly = new Date(startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      const minDate = startDateOnly > today ? startDateOnly : today;
      return { before: minDate };
    }

    return { before: today };
  };

  // Format date for input (DD/MM/YYYY)
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parse date from input (DD/MM/YYYY)
  const parseDateFromInput = (value: string) => {
    const parts = value.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return undefined;
  };

  const popoverContent = (
    <div
      className="w-80 max-h-[500px] overflow-y-auto overscroll-contain"
      style={{
        touchAction: 'auto',
        WebkitOverflowScrolling: 'touch'
      } as React.CSSProperties}
      onWheel={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="space-y-3 p-3">
        <div>
          <h4 className="font-semibold mb-1 text-sm">Dates</h4>
          <p className="text-xs text-muted-foreground">
            Set start and due dates
          </p>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-8 text-xs"
              >
                <Clock className="mr-2 h-3 w-3" />
                {startDate ? formatDateForInput(startDate) : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  if (date) {
                    setStartDate(date);
                    if (selectedDate && date > selectedDate) {
                      handleDateSelect(date);
                      toast.success("Due date has been adjusted");
                    }
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {isTimeEnabled && (
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-8"
            />
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-8 text-xs"
              >
                <Clock className="mr-2 h-3 w-3" />
                {selectedDate ? formatDateForInput(selectedDate) : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={getDisabledDatesForPopover()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {isTimeEnabled && (
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full h-8"
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="time-enabled-popover"
            checked={isTimeEnabled}
            onCheckedChange={(checked) => setIsTimeEnabled(checked as boolean)}
          />
          <Label
            htmlFor="time-enabled-popover"
            className="text-xs font-medium cursor-pointer"
          >
            Set time
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reminder" className="text-xs font-medium">
            Reminder
          </Label>
          <Select
            value={reminderMinutes?.toString() || "null"}
            onValueChange={(value) => setReminderMinutes(value === "null" ? null : Number(value))}
          >
            <SelectTrigger id="reminder" className="w-full h-8">
              <SelectValue placeholder="Select reminder" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {REMINDER_OPTIONS.map((option) => (
                <SelectItem key={option.value?.toString() || "null"} value={option.value?.toString() || "null"}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Repeat Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="repeat-enabled-popover"
              checked={isRepeatEnabled}
              onCheckedChange={(checked) => setIsRepeatEnabled(checked as boolean)}
            />
            <Label
              htmlFor="repeat-enabled-popover"
              className="text-xs font-medium cursor-pointer"
            >
              Repeat
            </Label>
          </div>
          {isRepeatEnabled && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-8 text-xs"
                />
                <Select
                  value={repeatFrequency}
                  onValueChange={(value) => setRepeatFrequency(value as RepeatFrequency)}
                >
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{repeatInterval === 1 ? "day" : "days"}</SelectItem>
                    <SelectItem value="weekly">{repeatInterval === 1 ? "week" : "weeks"}</SelectItem>
                    <SelectItem value="monthly">{repeatInterval === 1 ? "month" : "months"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Repeats every {repeatInterval} {repeatFrequency === "daily" ? (repeatInterval === 1 ? "day" : "days") : repeatFrequency === "weekly" ? (repeatInterval === 1 ? "week" : "weeks") : (repeatInterval === 1 ? "month" : "months")}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={handleSave}
            size="sm"
            className="flex-1 h-8"
            disabled={!selectedDate || updateDueMutation.isPending}
          >
            {updateDueMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {card.dueAt && (
            <Button
              onClick={handleRemove}
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              disabled={clearDueMutation.isPending}
            >
              {clearDueMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (triggerButton === null) {
    const getDateRangeModifiers = () => {
      if (!startDate || !selectedDate) return {};

      const start = new Date(startDate);
      const end = new Date(selectedDate);
      const [earlierDate, laterDate] = start <= end ? [start, end] : [end, start];

      const datesInRange: Date[] = [];
      const currentDate = new Date(earlierDate);
      currentDate.setDate(currentDate.getDate() + 1);

      while (currentDate < laterDate) {
        datesInRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        range_start: earlierDate,
        range_end: laterDate,
        range_middle: datesInRange,
      };
    };

    const modifiers = getDateRangeModifiers();
    const modifiersClassNames = {
      range_start: "bg-primary text-primary-foreground rounded-l-md",
      range_end: "bg-primary text-primary-foreground rounded-r-md",
      range_middle: "bg-primary/20 text-primary rounded-none",
    };

    const getDisabledDates = () => {
      if (isDueDateEnabled) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isStartDateEnabled && startDate) {
          const minDate = startDate > today ? startDate : today;
          return { before: minDate };
        }

        return { before: today };
      }
      return undefined;
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Dates</DialogTitle>
          </DialogHeader>

          <div
            className="overflow-y-auto overscroll-contain flex-1 space-y-4"
            style={{
              touchAction: 'auto',
              WebkitOverflowScrolling: 'touch'
            } as React.CSSProperties}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="start-date-checkbox"
                checked={isStartDateEnabled}
                onCheckedChange={(checked) => {
                  setIsStartDateEnabled(checked as boolean);
                  if (!checked) {
                    setStartDate(undefined);
                  } else if (!startDate) {
                    setStartDate(new Date());
                  }
                }}
              />
              <Label htmlFor="start-date-checkbox" className="text-sm font-medium">
                Start date
              </Label>
            </div>
            {isStartDateEnabled && (
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {startDate ? formatDateForInput(startDate) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          if (isDueDateEnabled && selectedDate && date > selectedDate) {
                            handleDateSelect(date);
                            toast.success("Due date has been adjusted");
                          }
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {isTimeEnabled && (
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="due-date-checkbox"
                checked={isDueDateEnabled}
                onCheckedChange={(checked) => {
                  setIsDueDateEnabled(checked as boolean);
                  if (!checked) {
                    setSelectedDate(undefined);
                  } else if (!selectedDate) {
                    setSelectedDate(new Date());
                  }
                }}
              />
              <Label htmlFor="due-date-checkbox" className="text-sm font-medium">
                Due date
              </Label>
            </div>
            {isDueDateEnabled && (
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {selectedDate ? formatDateForInput(selectedDate) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          if (date < today) {
                            toast.error("Due date cannot be before today");
                            return;
                          }

                          if (isStartDateEnabled && startDate && date < startDate) {
                            toast.error("Due date cannot be before start date");
                            return;
                          }
                          handleDateSelect(date);
                        }
                      }}
                      disabled={getDisabledDates()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {isTimeEnabled && (
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="time-enabled-dialog"
              checked={isTimeEnabled}
              onCheckedChange={(checked) => setIsTimeEnabled(checked as boolean)}
            />
            <Label
              htmlFor="time-enabled-dialog"
              className="text-sm font-medium cursor-pointer"
            >
              Set time
            </Label>
          </div>

          {isDueDateEnabled && (
            <div className="space-y-2">
              <Label htmlFor="reminder-dialog" className="text-sm font-medium">
                Set up reminders
              </Label>
              <Select
                value={reminderMinutes?.toString() || "null"}
                onValueChange={(value) => setReminderMinutes(value === "null" ? null : Number(value))}
              >
                <SelectTrigger id="reminder-dialog" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value?.toString() || "null"} value={option.value?.toString() || "null"}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isDueDateEnabled && reminderMinutes && (
            <p className="text-xs text-muted-foreground">
              Reminders will be sent to all members and watchers of this card
            </p>
          )}

          {/* Repeat Section in Dialog */}
          {isDueDateEnabled && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="repeat-enabled-dialog"
                  checked={isRepeatEnabled}
                  onCheckedChange={(checked) => setIsRepeatEnabled(checked as boolean)}
                />
                <Label
                  htmlFor="repeat-enabled-dialog"
                  className="text-sm font-medium cursor-pointer"
                >
                  Repeat
                </Label>
              </div>
              {isRepeatEnabled && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20"
                    />
                    <Select
                      value={repeatFrequency}
                      onValueChange={(value) => setRepeatFrequency(value as RepeatFrequency)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{repeatInterval === 1 ? "day" : "days"}</SelectItem>
                        <SelectItem value="weekly">{repeatInterval === 1 ? "week" : "weeks"}</SelectItem>
                        <SelectItem value="monthly">{repeatInterval === 1 ? "month" : "months"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Repeats every {repeatInterval} {repeatFrequency === "daily" ? (repeatInterval === 1 ? "day" : "days") : repeatFrequency === "weekly" ? (repeatInterval === 1 ? "week" : "weeks") : (repeatInterval === 1 ? "month" : "months")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={updateDueMutation.isPending}
            >
              {updateDueMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleRemove}
              variant="outline"
              className="flex-1"
              disabled={clearDueMutation.isPending}
            >
              {clearDueMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {!triggerButton && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold">Due Date</h3>
          </div>

          <div className="pl-7 flex items-center gap-2">
            {card.dueAt ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant={color === "default" ? "outline" : "secondary"}
                  className={cn("group relative pr-6", getBadgeClassName())}
                >
                  {isDueComplete ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  <span>{label || formattedDate}</span>
                  {label && formattedDate && (
                    <span className="ml-1 opacity-80">{formattedDate}</span>
                  )}
                  {card.repeatFrequency && (
                    <Repeat className="w-3 h-3 ml-1 opacity-70" />
                  )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={handleToggleComplete}
                >
                  {isDueComplete ? "Mark incomplete" : "Mark complete"}
                </Button>
              </div>
            ) : null}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  {card.dueAt ? "Edit" : "Add"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="bottom">
                {popoverContent}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {triggerButton && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" side="bottom">
            {popoverContent}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
