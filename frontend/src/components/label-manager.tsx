import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedColorPicker } from "@/components/color-picker";
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from "@/hooks/use-label";
import { Plus, Trash2, Loader2, Palette, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  userId: string;
  name: string;
  avatar?: string | null;
}

interface LabelManagerProps {
  members: Member[];
  creatorId: string;
  currentUserId: string;
}

interface LabelDialogData {
  id?: string;
  name: string;
  color: string;
}

// Predefined color palette for labels
const LABEL_COLORS = [
  "#22c55e", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#a855f7", // purple
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#6366f1", // indigo
  "#84cc16", // lime
];

export function LabelManager({ members, creatorId, currentUserId }: LabelManagerProps) {
  // Default to creator if there are multiple members, otherwise current user
  const defaultUserId = members.length > 1 ? creatorId : currentUserId;
  const [selectedUserId, setSelectedUserId] = useState(defaultUserId);
  
  const { data: labels = [], isLoading } = useLabels(selectedUserId);
  const { mutate: createLabel, isPending: isCreating } = useCreateLabel();
  const { mutate: updateLabel, isPending: isUpdating } = useUpdateLabel();
  const { mutate: deleteLabel, isPending: isDeleting } = useDeleteLabel();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogData, setDialogData] = useState<LabelDialogData>({
    name: "",
    color: LABEL_COLORS[0],
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Open dialog for creating a new label
  const openCreateDialog = () => {
    setDialogMode("create");
    setDialogData({ name: "", color: LABEL_COLORS[0] });
    setShowColorPicker(false);
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing label
  const openEditDialog = (label: { id: string; name: string; color: string }) => {
    setDialogMode("edit");
    setDialogData({ id: label.id, name: label.name, color: label.color });
    setShowColorPicker(false);
    setIsDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setShowColorPicker(false);
  };

  // Handle create
  const handleCreate = () => {
    if (!dialogData.name.trim()) {
      toast.error("Please enter a label name");
      return;
    }
    createLabel(
      { userId: selectedUserId, name: dialogData.name, color: dialogData.color },
      {
        onSuccess: () => {
          closeDialog();
          toast.success("Label created!");
        },
        onError: () => {
          toast.error("Failed to create label");
        },
      }
    );
  };

  // Handle update
  const handleUpdate = () => {
    if (!dialogData.name.trim()) {
      toast.error("Please enter a label name");
      return;
    }
    if (!dialogData.id) return;
    
    updateLabel(
      { userId: selectedUserId, labelId: dialogData.id, name: dialogData.name, color: dialogData.color },
      {
        onSuccess: () => {
          closeDialog();
          toast.success("Label updated!");
        },
        onError: () => {
          toast.error("Failed to update label");
        },
      }
    );
  };

  // Handle delete
  const handleDelete = (labelId: string) => {
    deleteLabel(
      { userId: selectedUserId, labelId },
      {
        onSuccess: () => {
          toast.success("Label deleted!");
        },
        onError: () => {
          toast.error("Failed to delete label");
        },
      }
    );
  };

  // Handle save (create or update)
  const handleSave = () => {
    if (dialogMode === "create") {
      handleCreate();
    } else {
      handleUpdate();
    }
  };

  const isPending = isCreating || isUpdating;
  
  // Find selected user's name
  const selectedUser = members.find(m => m.userId === selectedUserId);
  const isViewingOwnLabels = selectedUserId === currentUserId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 px-4">
        {/* User Selector - Show only if multiple members */}
        {members.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              View labels from:
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.name} {member.userId === creatorId && "(Creator)"} {member.userId === currentUserId && "(You)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Info message when viewing others' labels */}
        {!isViewingOwnLabels && (
          <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
            You're viewing {selectedUser?.name}'s labels. Switch to your own to create and edit labels.
          </div>
        )}

        {/* Label List */}
        <div className="space-y-2">
          {labels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No labels yet. {isViewingOwnLabels ? "Create one to get started!" : `${selectedUser?.name} hasn't created any labels yet.`}
            </p>
          )}
          {labels.map((label) => (
            <div key={label.id} className="group flex items-center overflow-hidden">
 
              <div
                className={cn(
                  "h-9 rounded-md px-3 flex items-center transition-all duration-300 ease-out w-full",
                  isViewingOwnLabels && "cursor-pointer group-hover:w-[calc(100%-32px)]"
                )}
                style={{ backgroundColor: label.color }}
                onClick={isViewingOwnLabels ? () => openEditDialog(label) : undefined}
              >
                <span className="text-white text-sm font-medium truncate">
                  {label.name || "Untitled"}
                </span>
              </div>
              
    
              {isViewingOwnLabels && (
                <div className="flex items-center gap-1 ml-1 w-0 group-hover:w-8 overflow-hidden transition-all duration-300 ease-out">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(label.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create New Label Button - Only show for own labels */}
        {isViewingOwnLabels && (
          <Button
            variant="outline"
            className="w-full"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create new label
          </Button>
        )}
      </div>

      {/* Label Dialog (Create/Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create Label" : "Edit Label"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Add a new label to organize your cards."
                : "Update the label name and color."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Label Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={dialogData.name}
                onChange={(e) =>
                  setDialogData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter label name"
                autoFocus
              />
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Color</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <Palette className="h-3 w-3 mr-1" />
                  {showColorPicker ? "Presets" : "Custom"}
                </Button>
              </div>

              {showColorPicker ? (
                <AdvancedColorPicker
                  color={dialogData.color}
                  onChange={(value: string) =>
                    setDialogData((prev) => ({ ...prev, color: value }))
                  }
                  className="w-full"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "h-8 w-8 rounded-full transition-all hover:scale-110",
                        dialogData.color === color &&
                          "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setDialogData((prev) => ({ ...prev, color }))
                      }
                    />
                  ))}
                </div>
              )}

              {/* Preview */}
              <div className="mt-3">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Preview
                </label>
                <div
                  className="h-8 rounded px-3 flex items-center"
                  style={{ backgroundColor: dialogData.color }}
                >
                  <span className="text-white text-sm font-medium truncate">
                    {dialogData.name || "Label name"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
