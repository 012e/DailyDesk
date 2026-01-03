import { useState } from "react";
import { Tag, Plus, Check, X, Pencil, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Card, Label } from "@/types/card";
import { cn } from "@/lib/utils";
import { useLabels, useCreateLabel, useUpdateLabel } from "@/hooks/use-label";

interface CardLabelsProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
  boardId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

// Predefined label colors (similar to Trello)
const LABEL_COLORS = [
  { name: "Green", color: "#61bd4f" },
  { name: "Yellow", color: "#f2d600" },
  { name: "Orange", color: "#ff9f1a" },
  { name: "Red", color: "#eb5a46" },
  { name: "Purple", color: "#c377e0" },
  { name: "Blue", color: "#0079bf" },
  { name: "Sky", color: "#00c2e0" },
  { name: "Lime", color: "#51e898" },
  { name: "Pink", color: "#ff78cb" },
  { name: "Black", color: "#344563" },
];

export function CardLabels({ card, onUpdate, boardId, isOpen: controlledIsOpen, onOpenChange: controlledOnOpenChange, triggerButton }: CardLabelsProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelName, setEditLabelName] = useState("");
  const [editLabelColor, setEditLabelColor] = useState("");

  // Fetch labels from API
  const { data: availableLabelsData = [] } = useLabels(boardId);
  const { mutate: createLabel } = useCreateLabel();
  const { mutate: updateLabel } = useUpdateLabel();

  // Ensure labels is always an array (defensive programming)
  const labels = Array.isArray(card.labels) ? card.labels : [];
  const availableLabels = availableLabelsData;

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;

  const handleAddLabel = (label: Label) => {
    const existingLabel = labels.find((l) => l.id === label.id);

    if (existingLabel) {
      // Remove label if it exists (toggle)
      onUpdate({
        labels: labels.filter((l) => l.id !== label.id),
      });
    } else {
      // Add new label
      onUpdate({
        labels: [...labels, label],
      });
    }
  };

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return;

    const newLabel: Label = {
      id: Date.now().toString(),
      name: newLabelName.trim(),
      color: selectedColor.color,
    };

    handleAddLabel(newLabel);
    setNewLabelName("");
  };

  const handleRemoveLabel = (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      labels: labels.filter((l) => l.id !== labelId),
    });
  };

  const handleToggleLabel = (label: Label) => {
    const existingLabel = labels.find((l) => l.id === label.id);
    if (existingLabel) {
      onUpdate({
        labels: labels.filter((l) => l.id !== label.id),
      });
    } else {
      onUpdate({
        labels: [...labels, label],
      });
    }
  };

  const handleStartEdit = (label: Label) => {
    setEditingLabelId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  const handleSaveEdit = () => {
    if (!editingLabelId) {
      setEditingLabelId(null);
      return;
    }

    // Update label via API
    updateLabel(
      {
        boardId,
        labelId: editingLabelId,
        name: editLabelName.trim(),
        color: editLabelColor,
      },
      {
        onSuccess: () => {
          // Also update in card labels if it's selected
          if (labels.some((l) => l.id === editingLabelId)) {
            onUpdate({
              labels: labels.map((l) =>
                l.id === editingLabelId
                  ? { ...l, name: editLabelName.trim(), color: editLabelColor }
                  : l
              ),
            });
          }
          setEditingLabelId(null);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingLabelId(null);
  };

  // Quick add from predefined colors
  const quickAddLabel = (colorDef: { name: string; color: string }) => {
    const newLabel: Label = {
      id: Date.now().toString(),
      name: colorDef.name,
      color: colorDef.color,
    };
    handleAddLabel(newLabel);
  };

  // Filter labels based on search query from available labels pool
  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Popover content to be reused
  const popoverContent = editingLabelId ? (
    // Edit mode
    <div className="space-y-3 p-3 w-80">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCancelEdit}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h4 className="font-semibold flex-1 text-center">Edit Label</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <UILabel className="text-xs">Label Name</UILabel>
        <Input
          value={editLabelName}
          onChange={(e) => setEditLabelName(e.target.value)}
          placeholder="Label name"
          className="h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSaveEdit();
            } else if (e.key === "Escape") {
              handleCancelEdit();
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <UILabel className="text-xs">Color</UILabel>
        <div className="flex flex-wrap gap-1">
          {LABEL_COLORS.map((colorDef) => (
            <button
              key={colorDef.color}
              onClick={() => setEditLabelColor(colorDef.color)}
              className={cn(
                "w-12 h-8 rounded border-2 transition-all",
                editLabelColor === colorDef.color
                  ? "border-foreground scale-110"
                  : "border-transparent"
              )}
              style={{ backgroundColor: colorDef.color }}
              title={colorDef.name}
            />
          ))}
        </div>
      </div>

      <Button onClick={handleSaveEdit} size="sm" className="w-full">
        Save
      </Button>
    </div>
  ) : (
    // Normal mode
    <div className="space-y-3 p-3 w-80">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Labels</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search labels..."
        className="h-8"
      />

      {/* Labels list */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        <UILabel className="text-xs">Labels</UILabel>
        {filteredLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No labels found
          </p>
        ) : (
          filteredLabels.map((label) => {
            const isSelected = labels.some((l) => l.id === label.id);

            return (
              <div
                key={label.id}
                className="flex items-center gap-2 rounded hover:bg-muted p-1"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleLabel(label)}
                  className="flex-shrink-0"
                />
                <div
                  className="flex-1 h-8 rounded px-3 flex items-center text-sm font-medium text-white cursor-pointer min-w-0"
                  style={{ backgroundColor: label.color }}
                  onClick={() => handleToggleLabel(label)}
                >
                  <span className="truncate">{label.name || ""}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => handleStartEdit(label)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Create new label */}
      <div className="pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            // Create label via API
            createLabel(
              {
                boardId,
                name: "",
                color: LABEL_COLORS[0].color,
              },
              {
                onSuccess: (newLabel) => {
                  // Enter edit mode for the new label
                  setEditingLabelId(newLabel.id);
                  setEditLabelName(newLabel.name);
                  setEditLabelColor(newLabel.color);
                },
              }
            );
          }}
        >
          Create New Label
        </Button>
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
            <h3 className="font-semibold text-sm">Labels</h3>
          </div>

          {/* Labels display */}
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <Badge
                key={label.id}
                className="h-8 px-3 text-sm font-medium text-white"
                style={{
                  backgroundColor: label.color,
                }}
              >
                {label.name}
              </Badge>
            ))}
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
