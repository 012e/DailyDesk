import { useState, useRef, useEffect } from "react";
import { AlignLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Card } from "@/types/card";

interface CardDescriptionProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export function CardDescription({ card, onUpdate }: CardDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(card.description || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when starting edit
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor at the end of text
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedDescription = description.trim();

    // Allow saving empty description
    if (trimmedDescription !== (card.description || "")) {
      onUpdate({ description: trimmedDescription || undefined });
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setDescription(card.description || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }

    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setDescription(card.description || "");
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-5 h-5" />
          <h3 className="font-semibold">Description</h3>
        </div>

        {!isEditing && card.description && (
          <Button variant="ghost" size="sm" onClick={startEditing}>
            Edit
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="pl-7">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a more detailed description..."
              className="min-h-24 resize-y"
            />

            <div className="flex items-center gap-2">
              <Button onClick={handleSave} size="sm">
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                Ctrl+Enter to save
              </span>
            </div>
          </div>
        ) : (
          <>
            {card.description ? (
              <div
                className="px-2 py-1 rounded hover:bg-muted cursor-pointer whitespace-pre-wrap break-words"
                onClick={startEditing}
              >
                {card.description}
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={startEditing}
              >
                Add a more detailed description...
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
