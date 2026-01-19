"use client";

import { RiDeleteBinLine } from "@remixicon/react";
import { addHours, isBefore } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tag, UserPlus } from "lucide-react";

import type { CalendarEvent, EventColor, Label as EventLabel, Member as EventMember } from "@/components/event-calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CardLabels } from "@/components/card-edit-dialog/card-labels";
import { CardMembers } from "@/components/card-edit-dialog/card-members";
import { CardDates } from "@/components/card-edit-dialog/card-dates";
import type { Card } from "@/types/card";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  boardId?: string;
  lists?: Array<{ id: string; title: string }>;
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  boardId,
  lists,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [dueComplete, setDueComplete] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const [repeatFrequency, setRepeatFrequency] = useState<Card["repeatFrequency"]>(null);
  const [repeatInterval, setRepeatInterval] = useState<Card["repeatInterval"]>(null);
  const [location, setLocation] = useState("");
  const [listId, setListId] = useState<string>("");
  const [labels, setLabels] = useState<EventLabel[]>([]);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [color, setColor] = useState<EventColor>("sky");
  const [error, setError] = useState<string | null>(null);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartDate(null);
    setDueAt(null);
    setDueComplete(false);
    setReminderMinutes(null);
    setRepeatFrequency(null);
    setRepeatInterval(null);
    setLocation("");
    setListId(lists?.[0]?.id || "");
    setLabels([]);
    setMembers([]);
    setColor("sky");
    setError(null);
  }, [lists]);

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setListId(event.listId || lists?.[0]?.id || "");
      setLabels(event.labels || []);
      setMembers(event.members || []);

      const fallbackStart = event.start ? new Date(event.start) : null;
      const fallbackDue = event.end ? new Date(event.end) : null;

      setStartDate(event.startDate ? new Date(event.startDate) : fallbackStart);
      setDueAt(event.dueAt ? new Date(event.dueAt) : fallbackDue);
      setDueComplete(event.dueComplete ?? false);
      setReminderMinutes(event.reminderMinutes ?? null);
      setRepeatFrequency(event.repeatFrequency ?? null);
      setRepeatInterval(event.repeatInterval ?? null);
      setLocation(event.location || "");
      setColor((event.color as EventColor) || "sky");
      setError(null); // Reset error when opening dialog
    } else {
      resetForm();
    }
  }, [event, resetForm, lists]);

  const handleSave = () => {
    if (!startDate && !dueAt) {
      setError("Pick a start date or due date");
      return;
    }

    if (startDate && dueAt && isBefore(dueAt, startDate)) {
      setError("Due date cannot be before start date");
      return;
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : "(no title)";
    const eventStart = startDate || dueAt || new Date();
    const eventEnd = dueAt || addHours(eventStart, 1);

    onSave({
      allDay: false,
      color,
      description,
      end: eventEnd,
      id: event?.id || "",
      listId,
      labels,
      members,
      location,
      start: eventStart,
      startDate: startDate ?? undefined,
      dueAt: dueAt ?? undefined,
      dueComplete,
      reminderMinutes,
      repeatFrequency,
      repeatInterval,
      title: eventTitle,
    });
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  // Create a temporary card object for CardLabels and CardMembers components
  const tempCard: Partial<Card> = useMemo(() => ({
    id: event?.id || "",
    title: title,
    description: description || undefined,
    listId: listId || "",
    labels: labels as any,
    members: members as any,
    startDate: startDate,
    dueAt: dueAt,
    dueComplete: dueComplete,
    reminderMinutes: reminderMinutes,
    repeatFrequency: repeatFrequency,
    repeatInterval: repeatInterval,
  }), [
    event?.id,
    title,
    description,
    listId,
    labels,
    members,
    startDate,
    dueAt,
    dueComplete,
    reminderMinutes,
    repeatFrequency,
    repeatInterval,
  ]);

  const handleCardUpdate = useCallback((updates: Partial<Card>) => {
    if (updates.labels !== undefined) {
      setLabels(updates.labels as EventLabel[] || []);
    }
    if (updates.members !== undefined) {
      setMembers(updates.members as EventMember[] || []);
    }
    if ("startDate" in updates) {
      setStartDate(
        updates.startDate ? new Date(updates.startDate) : null
      );
    }
    if ("dueAt" in updates) {
      setDueAt(
        updates.dueAt ? new Date(updates.dueAt) : null
      );
    }
    if ("dueComplete" in updates && updates.dueComplete !== undefined) {
      setDueComplete(!!updates.dueComplete);
    }
    if ("reminderMinutes" in updates) {
      setReminderMinutes(updates.reminderMinutes ?? null);
    }
    if ("repeatFrequency" in updates) {
      setRepeatFrequency(updates.repeatFrequency ?? null);
    }
    if ("repeatInterval" in updates) {
      setRepeatInterval(updates.repeatInterval ?? null);
    }
  }, []);

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Card" : "Create Card"}</DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id
              ? "Edit the details of this card"
              : "Add a new card to your calendar"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="py-2 px-3 text-sm rounded-md bg-destructive/15 text-destructive">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
          </div>

          {lists && lists.length > 0 && (
            <div className="*:not-first:mt-1.5">
              <Label htmlFor="list">List</Label>
              <Select onValueChange={setListId} value={listId}>
                <SelectTrigger id="list">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Labels and Members buttons */}
          {boardId && (
            <div className="flex flex-wrap gap-2">
              <CardLabels
                card={tempCard as Card}
                onUpdate={handleCardUpdate}
                boardId={boardId}
                isOpen={isLabelPopoverOpen}
                onOpenChange={setIsLabelPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Tag className="h-4 w-4 mr-1" />
                    Labels {labels.length > 0 && `(${labels.length})`}
                  </Button>
                }
              />
              <CardMembers
                card={tempCard as Card}
                onUpdate={handleCardUpdate}
                boardId={boardId}
                isOpen={isMemberPopoverOpen}
                onOpenChange={setIsMemberPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Members {members.length > 0 && `(${members.length})`}
                  </Button>
                }
              />
            </div>
          )}

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              value={description}
            />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label>Dates</Label>
            <CardDates
              card={tempCard as Card}
              createMode
              onUpdate={handleCardUpdate}
            />
          </div>

          
        </div>
        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              aria-label="Delete event"
              onClick={handleDelete}
              size="icon"
              variant="outline"
            >
              <RiDeleteBinLine aria-hidden="true" size={16} />
            </Button>
          )}
          <div className="flex flex-1 gap-2 justify-end">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
