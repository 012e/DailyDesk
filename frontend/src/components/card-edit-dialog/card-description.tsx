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

  // Focus textarea khi bắt đầu edit
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Đặt cursor ở cuối text
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedDescription = description.trim();

    // Cho phép save empty description
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
    // Ctrl/Cmd + Enter để save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }

    // Escape để cancel
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
          <h3 className="font-semibold">Mô tả</h3>
        </div>

        {!isEditing && card.description && (
          <Button variant="ghost" size="sm" onClick={startEditing}>
            Sửa
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
              placeholder="Thêm mô tả chi tiết hơn..."
              className="min-h-24 resize-y"
            />

            <div className="flex items-center gap-2">
              <Button onClick={handleSave} size="sm">
                Lưu
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Hủy
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                Ctrl+Enter để lưu
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
                Thêm mô tả chi tiết hơn...
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
