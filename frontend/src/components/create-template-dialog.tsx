"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { Plus, Trash2 } from "lucide-react";
import type { CreateTemplateType, TemplateLabelType, TemplateListType } from "@/hooks/use-template";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (template: CreateTemplateType) => Promise<void>;
}

const defaultColors = [
  "#eb5a46", // red
  "#ff9f1a", // orange
  "#61bd4f", // green
  "#00c2e0", // cyan
  "#0079bf", // blue
  "#c377e0", // purple
];

export default function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("business");
  const [isPublic, setIsPublic] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>("#0079bf");
  const [lists, setLists] = useState<TemplateListType[]>([
    { name: "To Do", order: 0 },
    { name: "In Progress", order: 1 },
    { name: "Done", order: 2 },
  ]);
  const [labels, setLabels] = useState<TemplateLabelType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddList = () => {
    setLists([...lists, { name: "", order: lists.length }]);
  };

  const handleRemoveList = (index: number) => {
    setLists(lists.filter((_, i) => i !== index));
  };

  const handleUpdateList = (index: number, name: string) => {
    const updated = [...lists];
    updated[index] = { ...updated[index], name };
    setLists(updated);
  };

  const handleAddLabel = () => {
    if (labels.length < 10) {
      setLabels([
        ...labels,
        { name: "", color: defaultColors[labels.length % defaultColors.length] },
      ]);
    }
  };

  const handleRemoveLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  const handleUpdateLabel = (index: number, field: "name" | "color", value: string) => {
    const updated = [...labels];
    updated[index] = { ...updated[index], [field]: value };
    setLabels(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const validLists = lists.filter((l) => l.name.trim());
    if (validLists.length === 0) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category as "business" | "education" | "personal" | "design" | "marketing" | "engineering" | "other",
        isPublic,
        backgroundColor: backgroundColor || undefined,
        lists: validLists.map((l, i) => ({ ...l, order: i })),
        labels: labels.filter((l) => l.name.trim()),
      });
      // Reset form
      setName("");
      setDescription("");
      setLists([
        { name: "To Do", order: 0 },
        { name: "In Progress", order: 1 },
        { name: "Done", order: 2 },
      ]);
      setLabels([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Spinner className="size-10" />
            <p className="text-xl font-semibold">Creating template...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create Board Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for your boards
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Project Template"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your template..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      placeholder="#0079bf"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isPublic">Make this template public</Label>
              </div>

              {/* Lists */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lists *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddList}
                  >
                    <Plus className="size-4 mr-1" />
                    Add List
                  </Button>
                </div>
                <div className="space-y-2">
                  {lists.map((list, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={list.name}
                        onChange={(e) => handleUpdateList(index, e.target.value)}
                        placeholder={`List ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveList(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Labels (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLabel}
                    disabled={labels.length >= 10}
                  >
                    <Plus className="size-4 mr-1" />
                    Add Label
                  </Button>
                </div>
                <div className="space-y-2">
                  {labels.map((label, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={label.name}
                        onChange={(e) =>
                          handleUpdateLabel(index, "name", e.target.value)
                        }
                        placeholder={`Label ${index + 1}`}
                      />
                      <Input
                        type="color"
                        value={label.color}
                        onChange={(e) =>
                          handleUpdateLabel(index, "color", e.target.value)
                        }
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLabel(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || lists.filter((l) => l.name.trim()).length === 0}
              >
                Create Template
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
