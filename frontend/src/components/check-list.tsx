
import type { Card } from "@/types/card";
import { useState } from "react";
import { toast } from "react-hot-toast";
import type { ChecklistItem } from "@/types/checklist-items";
import { useChecklistItems, useAddChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from "@/hooks/use-checklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMembers } from "@/hooks/use-member";
import { User, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CheckList({
  card,
  boardId: propBoardId,
  onUpdate,
  ownerInfo,
}: {
  card: Card;
  boardId?: string;
  onUpdate: (updates: Partial<Card>) => void;
  ownerInfo?: { userId: string; name: string; email: string; avatar?: string | null };
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
  
  // Fetch board members for assignment
  const { data: fetchedBoardMembers = [] } = useMembers(boardId);

  const boardMembers = [...fetchedBoardMembers];

  if (ownerInfo) {
    const isOwnerInMembers = fetchedBoardMembers.some(m => m.userId === ownerInfo.userId);
    if (!isOwnerInMembers) {
      boardMembers.unshift({
        id: ownerInfo.userId, 
        userId: ownerInfo.userId,
        boardId: boardId || "",
        name: ownerInfo.name,
        email: ownerInfo.email,
        avatar: ownerInfo.avatar,
        role: "admin",
        addedAt: new Date(),
      } as any);
    }
  }

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
    const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

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

    const handleToggleMember = (memberId: string) => {
      const currentMembers = item.members || [];
      const isMember = currentMembers.some((m) => m.id === memberId);
      
      if (isMember) {
        // Remove member
        updateMutation.mutate({
          ...item,
          members: currentMembers.filter((m) => m.id !== memberId).map(m => ({ id: m.id })),
        });
      } else {
        // Add member
        updateMutation.mutate({
          ...item,
          members: [...currentMembers.map(m => ({ id: m.id })), { id: memberId }],
        });
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
          {/* Display assigned members */}
          {item.members && item.members.length > 0 && (
            <div className="flex -space-x-2">
              {item.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={member.name} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {member.initials || member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {item.members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                  <span className="text-xs">+{item.members.length - 3}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Add member button */}
          <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Assign member"
              >
                <User className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Gán thành viên</h4>
                  <p className="text-xs text-muted-foreground">
                    Chọn thành viên cho mục này
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {boardMembers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Không có thành viên</p>
                  ) : (
                    boardMembers.map((member) => {
                      const isMember = item.members?.some((m) => m.id === member.id);
                      return (
                        <button
                          key={member.id}
                          onClick={() => handleToggleMember(member.id)}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors",
                            isMember && "bg-accent"
                          )}
                        >
                          <Avatar className="h-6 w-6">
                            {member.avatar ? (
                              <AvatarImage src={member.avatar} alt={member.name} />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                          {isMember && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

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
