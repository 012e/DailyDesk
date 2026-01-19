import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Card } from "@/types/card";
import { formatDistanceToNow } from "date-fns";
import { useCardTimeline, useAddComment, useUpdateComment, useDeleteComment } from "@/hooks/use-comments";
import { Loader2, Activity } from "lucide-react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

interface CardCommentsProps {
  card: Card;
  boardId: string;
  showActivities?: boolean; // Controlled by parent component
  onToggleActivities?: () => void;
  // Create mode props
  isCreateMode?: boolean;
  pendingComments?: string[];
  onAddPendingComment?: (comment: string) => void;
}

export function CardComments({
  card,
  boardId,
  showActivities = true,
  onToggleActivities,
  isCreateMode = false,
  pendingComments = [],
  onAddPendingComment,
}: CardCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch timeline (comments + activities)
  const { data: timeline = [], isLoading } = useCardTimeline(boardId, card.id);
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();
  const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Filter timeline based on showActivities
  const displayItems = showActivities
    ? timeline
    : timeline.filter((item) => item.type === "comment");

  // Auto-resize textarea for new comment
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [commentText]);

  // Auto-resize textarea for edit comment
  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height =
        editTextareaRef.current.scrollHeight + "px";
    }
  }, [editText]);

  // Focus edit textarea when entering edit mode
  useEffect(() => {
    if (editingCommentId && editTextareaRef.current) {
      editTextareaRef.current.focus();
      // Set cursor at the end
      editTextareaRef.current.setSelectionRange(
        editTextareaRef.current.value.length,
        editTextareaRef.current.value.length
      );
    }
  }, [editingCommentId]);

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    if (isCreateMode && onAddPendingComment) {
      onAddPendingComment(commentText.trim());
      setCommentText("");
      setIsComposing(false);
      return;
    }

    addComment(
      {
        boardId,
        cardId: card.id,
        content: commentText.trim(),
      },
      {
        onSuccess: () => {
          setCommentText("");
          setIsComposing(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }

    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleCancel = () => {
    setCommentText("");
    setIsComposing(false);
  };

  const handleStartEdit = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditText(currentContent);
  };

  const handleSaveEdit = () => {
    if (!editingCommentId || !editText.trim()) return;

    updateComment(
      {
        boardId,
        cardId: card.id,
        commentId: editingCommentId,
        content: editText.trim(),
      },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditText("");
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    }

    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await confirm({
      title: "Xóa bình luận",
      description: "Bạn có chắc chắn muốn xóa bình luận này?",
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive"
    });
    if (!confirmed) return;

    deleteComment({
      boardId,
      cardId: card.id,
      commentId,
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
          placeholder="Write a comment..."
          className="resize-none min-h-[80px] text-sm"
          disabled={isAddingComment}
        />

        {isComposing && (
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              disabled={isAddingComment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              size="sm"
              disabled={!commentText.trim() || isAddingComment}
            >
              {isAddingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Toggle activities button */}
      {onToggleActivities && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleActivities}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Activity className="mr-2 h-4 w-4" />
          {showActivities ? "Hide" : "Show"} Activity
        </Button>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Timeline (Comments + Activities) */}
      {!isLoading && (
        <div className="space-y-3">
          {displayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            displayItems.map((item) => {
              if (item.type === "comment") {
                // Render comment
                const comment = item;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div key={comment.id} className="flex gap-2 items-start text-sm group">
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

                      {isEditing ? (
                        // Edit mode
                        <div className="space-y-2">
                          <Textarea
                            ref={editTextareaRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="resize-none min-h-[60px] text-sm"
                            disabled={isUpdatingComment}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveEdit}
                              size="sm"
                              disabled={!editText.trim() || isUpdatingComment}
                            >
                              {isUpdatingComment ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              variant="ghost"
                              size="sm"
                              disabled={isUpdatingComment}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="bg-background rounded p-2 border">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {comment.content}
                            </p>
                          </div>

                          {/* Actions: Edit • Delete */}
                          <div className="flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(comment.id, comment.content)}
                              className="hover:underline text-muted-foreground hover:text-foreground"
                            >
                              Edit
                            </button>
                            <span className="text-muted-foreground">•</span>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="hover:underline text-muted-foreground hover:text-foreground"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              } else {
                // Render activity
                const activity = item;
                return (
                  <div
                    key={activity.id}
                    className="flex gap-2 items-start text-sm opacity-75"
                  >
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage
                        src={activity.user.avatar}
                        alt={activity.user.name}
                      />
                      <AvatarFallback className="text-xs bg-muted">
                        {activity.user.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {activity.user.name}
                        </span>{" "}
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      )}

      {/* Pending comments (Create Mode) */}
      {isCreateMode && pendingComments.length > 0 && (
        <div className="space-y-3 mt-3 border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground">Pending Comments (will be saved on create)</p>
          {pendingComments.map((comment, index) => (
            <div key={`pending-${index}`} className="flex gap-2 items-start text-sm opacity-80">
               <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarFallback className="text-xs">You</AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0 space-y-1">
                 <div className="flex items-center gap-2">
                   <span className="font-semibold truncate">You</span>
                   <span className="text-xs text-muted-foreground">Just now</span>
                 </div>
                 <div className="bg-background rounded p-2 border border-dashed">
                   <p className="text-sm whitespace-pre-wrap break-words">{comment}</p>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}
