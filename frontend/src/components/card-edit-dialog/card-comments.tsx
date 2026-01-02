import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Card, Comment, Member } from "@/types/card";
import { formatDistanceToNow } from "date-fns";

interface CardCommentsProps {
  card: Card;
  currentUser?: Member; // Current logged in user
  onUpdate: (updates: Partial<Card>) => void;
}

// Mock current user (trong thực tế sẽ lấy từ auth context)
const DEFAULT_USER: Member = {
  id: "current",
  name: "You",
  email: "you@example.com",
  initials: "YO",
  avatar: undefined,
};

export function CardComments({
  card,
  currentUser = DEFAULT_USER,
  onUpdate,
}: CardCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ensure comments is always an array (defensive programming)
  const comments = Array.isArray(card.comments) ? card.comments : [];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [commentText]);

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText.trim(),
      userId: currentUser.id,
      user: currentUser,
      createdAt: new Date(),
    };

    onUpdate({
      comments: [...comments, newComment],
    });

    setCommentText("");
    setIsComposing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter để submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }

    // Escape để cancel
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleCancel = () => {
    setCommentText("");
    setIsComposing(false);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;

    onUpdate({
      comments: comments.filter((c) => c.id !== commentId),
    });
  };

  return (
    <div className="space-y-4">
      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onFocus={() => setIsComposing(true)}
          onKeyDown={handleKeyDown}
          placeholder="Viết bình luận..."
          className="resize-none min-h-[80px] text-sm"
        />

        {isComposing && (
          <div className="flex gap-2 justify-end">
            <Button onClick={handleCancel} variant="ghost" size="sm">
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              size="sm"
              disabled={!commentText.trim()}
            >
              Lưu
            </Button>
          </div>
        )}
      </div>

      {/* Activity log */}
      <div className="space-y-3">
        {/* Sample activity - user added card */}
        <div className="flex gap-2 items-start text-sm">
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarFallback className="text-xs bg-blue-500 text-white">
              HN
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p>
              <span className="font-semibold">Huy Pham Nhat</span> added this card to Backlog
            </p>
            <p className="text-xs text-muted-foreground">Nov 8, 2025, 1:37 PM</p>
          </div>
        </div>

        {/* Comments list */}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2 items-start text-sm">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage
                src={comment.user.avatar}
                alt={comment.user.name}
              />
              <AvatarFallback className="text-xs">
                {comment.user.initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">
                  {comment.user.name}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <div className="bg-background rounded p-2 border">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {comment.text}
                </p>
              </div>

              {comment.userId === currentUser.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
