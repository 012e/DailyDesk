"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTemplate, useCreateBoardFromTemplate } from "@/hooks/use-template";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, List } from "lucide-react";
import { useNavigate } from "react-router";

interface TemplatePreviewDialogProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export default function TemplatePreviewDialog({
  templateId,
  open,
  onOpenChange,
  onClose,
}: TemplatePreviewDialogProps) {
  const [boardName, setBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const template = useTemplate(templateId);
  const { createBoardFromTemplate } = useCreateBoardFromTemplate();
  const navigate = useNavigate();

  const handleUseTemplate = async () => {
    if (!boardName.trim()) return;

    setIsCreating(true);
    try {
      const board = await createBoardFromTemplate(templateId, boardName.trim(), true);
      onClose();
      // Navigate to the new board
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error("Error creating board from template:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {isCreating ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Spinner className="size-10" />
            <p className="text-xl font-semibold">Creating your board...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <DialogDescription>
                {template.description || "No description provided"}
              </DialogDescription>
            </DialogHeader>

            {/* Template Preview */}
            <div className="space-y-4 py-4">
              {/* Template Info */}
              <div className="flex gap-2">
                <Badge variant="secondary" className="capitalize">
                  {template.category || "other"}
                </Badge>
                {template.isPublic && <Badge variant="outline">Public</Badge>}
              </div>

              {/* Background Preview */}
              {(template.backgroundColor || template.backgroundUrl) && (
                <div
                  className="h-24 rounded-lg border"
                  style={{
                    backgroundColor: template.backgroundColor || undefined,
                    backgroundImage: template.backgroundUrl
                      ? `url(${template.backgroundUrl})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}

              {/* Lists Preview */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Lists ({template.lists.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {template.lists
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((list: any) => (
                      <Card key={list.id} className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            {list.name}
                          </CardTitle>
                        </CardHeader>
                        {list.cards && list.cards.length > 0 && (
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              {list.cards.length} card{list.cards.length !== 1 ? "s" : ""}
                            </p>
                            <ul className="mt-2 space-y-1">
                              {list.cards
                                .sort((a: any, b: any) => a.order - b.order)
                                .slice(0, 3)
                                .map((card: any) => (
                                  <li
                                    key={card.id}
                                    className="text-xs text-muted-foreground truncate"
                                  >
                                    • {card.name}
                                  </li>
                                ))}
                              {list.cards.length > 3 && (
                                <li className="text-xs text-muted-foreground italic">
                                  +{list.cards.length - 3} more...
                                </li>
                              )}
                            </ul>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                </div>
              </div>

              {/* Labels Preview */}
              {template.labels && template.labels.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Labels ({template.labels.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {template.labels.map((label: any) => (
                      <Badge
                        key={label.id}
                        style={{
                          backgroundColor: label.color,
                          color: "white",
                        }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Board Name Input */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="boardName">Board Name *</Label>
                <Input
                  id="boardName"
                  placeholder="e.g., My Project Board"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && boardName.trim()) {
                      handleUseTemplate();
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUseTemplate}
                disabled={!boardName.trim() || isCreating}
              >
                Use This Template
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
