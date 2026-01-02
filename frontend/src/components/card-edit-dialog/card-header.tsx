import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Card } from "@/types/card";

interface CardHeaderProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export function CardHeader({ card, onUpdate }: CardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea khi bắt đầu edit
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [title, isEditing]);

  const handleSave = () => {
    const trimmedTitle = title.trim();

    if (trimmedTitle === "") {
      // Nếu title rỗng, revert về giá trị cũ
      setTitle(card.title);
      setIsEditing(false);
      return;
    }

    if (trimmedTitle !== card.title) {
      onUpdate({ title: trimmedTitle });
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }

    if (e.key === "Escape") {
      setTitle(card.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <Checkbox className="mt-1" />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="font-semibold text-xl resize-none min-h-0 p-2 -ml-2"
            rows={1}
          />
        ) : (
          <h2
            className="font-semibold text-xl cursor-pointer hover:bg-muted rounded px-2 py-1 -mx-2 -my-1 break-words"
            onClick={() => setIsEditing(true)}
          >
            {card.title}
          </h2>
        )}
      </div>
    </div>
  );
}
