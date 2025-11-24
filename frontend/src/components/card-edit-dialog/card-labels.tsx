import { useState } from "react";
import { Tag, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import type { Card, Label } from "@/types/card";
import { cn } from "@/lib/utils";

interface CardLabelsProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

// Predefined label colors (giống Trello)
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

export function CardLabels({ card, onUpdate }: CardLabelsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);

  const labels = card.labels || [];

  const handleAddLabel = (label: Label) => {
    const existingLabel = labels.find((l) => l.id === label.id);

    if (existingLabel) {
      // Remove label nếu đã tồn tại (toggle)
      onUpdate({
        labels: labels.filter((l) => l.id !== label.id),
      });
    } else {
      // Add label mới
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

  // Quick add từ predefined colors
  const quickAddLabel = (colorDef: { name: string; color: string }) => {
    const newLabel: Label = {
      id: Date.now().toString(),
      name: colorDef.name,
      color: colorDef.color,
    };
    handleAddLabel(newLabel);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5" />
        <h3 className="font-semibold">Labels</h3>
      </div>

      {/* Labels display */}
      <div className="pl-7 flex flex-wrap gap-1">
        {labels.map((label) => (
          <Badge
            key={label.id}
            className="group relative pr-6 cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: label.color,
              color: "#fff",
            }}
            onClick={() => handleRemoveLabel(label.id, {} as React.MouseEvent)}
          >
            {label.name}
            <X className="w-3 h-3 absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Badge>
        ))}

        {/* Add button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Plus className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Labels</h4>
                <p className="text-xs text-muted-foreground">
                  Select a label to add or remove
                </p>
              </div>

              {/* Quick labels */}
              <div className="space-y-1">
                {LABEL_COLORS.map((colorDef) => {
                  const existingLabel = labels.find(
                    (l) => l.color === colorDef.color
                  );
                  const isSelected = existingLabel !== undefined;

                  return (
                    <button
                      key={colorDef.color}
                      onClick={() => {
                        if (existingLabel) {
                          handleRemoveLabel(
                            existingLabel.id,
                            {} as React.MouseEvent
                          );
                        } else {
                          quickAddLabel(colorDef);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity"
                      )}
                      style={{ backgroundColor: colorDef.color }}
                    >
                      <span className="flex-1 text-left">{colorDef.name}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>

              {/* Create custom label */}
              <div className="space-y-2 pt-2 border-t">
                <UILabel className="text-xs">Create custom label</UILabel>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label name"
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateLabel();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {LABEL_COLORS.map((colorDef) => (
                    <button
                      key={colorDef.color}
                      onClick={() => setSelectedColor(colorDef)}
                      className={cn(
                        "w-8 h-6 rounded border-2 transition-all",
                        selectedColor.color === colorDef.color
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: colorDef.color }}
                      title={colorDef.name}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleCreateLabel}
                  size="sm"
                  className="w-full"
                  disabled={!newLabelName.trim()}
                >
                  Create Label
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
