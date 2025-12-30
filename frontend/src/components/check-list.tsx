
import type { Card } from "@/types/card";
import { useState } from "react";
import { toast } from "react-hot-toast";
import type { ChecklistItem } from "@/types/checklist-items";
import { useChecklistItems, useAddChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from "@/hooks/use-checklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function CheckList({
  card,
  boardId: propBoardId,
  onUpdate,
}: {
  card: Card;
  boardId?: string;
  onUpdate: (updates: Partial<Card>) => void;
}) {
  // Prefer explicit boardId prop (passed from CardEditDialog), fallback to card.listId only if necessary
  const boardId = propBoardId ?? card.listId;
  const cardId = card.id;

  // Local state for new checklist item and creation mode
  const [newItem, setNewItem] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch checklist items
  const { data: items = [], isLoading, isError } = useChecklistItems(boardId, cardId);
  const addMutation = useAddChecklistItem(boardId, cardId);
  const updateMutation = useUpdateChecklistItem(boardId, cardId);
  const deleteMutation = useDeleteChecklistItem(boardId, cardId);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
  };

  const handleCreate = async () => {
    if (!newItem.trim()) return;
    try {
      await addMutation.mutateAsync({ name: newItem, completed: false, order: items.length, cardId });
      setNewItem("");
      setCreating(false);
      toast.success("Checklist item created");
    } catch (err: any) {
      console.error("Failed to create checklist item:", err);
      toast.error(err?.message || "Failed to create checklist item");
    }
  };

  const handleCancel = () => {
    setNewItem("");
    setCreating(false);
  };

  const handleToggle = (item: ChecklistItem) => {
    updateMutation.mutate({ ...item, completed: !item.completed });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleNameChange = (item: ChecklistItem, name: string) => {
    updateMutation.mutate({ ...item, name });
  };

  // Helper: per-item row with local edit state
  function ChecklistRow({
    item,
  }: {
    item: ChecklistItem;
  }) {
    const [editing, setEditing] = useState(false);
    const [localName, setLocalName] = useState(item.name);

    const onSubmitName = () => {
      if (localName.trim() && localName !== item.name) {
        updateMutation.mutate({ ...item, name: localName });
      }
      setEditing(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmitName();
      }
      if (e.key === "Escape") {
        setLocalName(item.name);
        setEditing(false);
      }
    };

    return (
      <div className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-accent/40 transition-colors">
        <Checkbox
          checked={item.completed}
          onCheckedChange={() => handleToggle(item)}
          className="mt-0.5"
          aria-label={`Mark ${item.name} as ${item.completed ? "incomplete" : "complete"}`}
        />

        {editing ? (
          <input
            className="flex-1 bg-transparent outline-none px-2 py-1 rounded-md border border-muted/30 focus:border-primary"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={onSubmitName}
            onKeyDown={onKeyDown}
            autoFocus
          />
        ) : (
          <button
            className={`flex-1 text-left ${item.completed ? "line-through text-muted-foreground" : ""}`}
            onClick={() => setEditing(true)}
            aria-label={`Edit ${item.name}`}
          >
            {item.name}
          </button>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Delete this checklist item?")) handleDelete(item.id);
            }}
            disabled={deleteMutation.isPending}
            aria-label="Delete checklist item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M9 6v12a1 1 0 001 1h4a1 1 0 001-1V6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11v6M14 11v6" />
            </svg>
          </Button>
        </div>
      </div>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const percent = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Checklist</h3>
          <p className="text-xs text-muted-foreground">{completedCount}/{items.length} completed</p>
        </div>
        <div className="flex items-center gap-2">
          {!creating ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add item
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter checklist name..."
                className="min-w-[220px]"
                autoFocus
              />
              <Button onClick={handleCreate} size="sm" disabled={addMutation.isPending || !newItem.trim()}>
                {addMutation.isPending ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" strokeOpacity="0.2" />
                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                ) : (
                  'Create'
                )}
              </Button>
              <Button onClick={handleCancel} size="sm" variant="ghost" type="button">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
        <div className="h-2 bg-primary rounded-full transition-width" style={{ width: `${percent}%` }} />
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {/* Only show error if error exists AND not just empty checklist */}
        {isError && items.length > 0 && (
          <div className="text-destructive">Failed to load checklist.</div>
        )}

        {items.length === 0 && !isLoading ? (
          <div className="text-sm text-muted-foreground">No checklist items yet. Click "Add item" to create one.</div>
        ) : (
          items.map((item) => <ChecklistRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
