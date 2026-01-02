import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, X, FileIcon, Link2, ExternalLink, Download } from "lucide-react";
import type { Attachment, Card } from "@/types/card";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface AttachmentAreaProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

export default function AttachmentArea({
  card,
  onUpdate,
}: AttachmentAreaProps) {
  const attachments = card.attachments || [];
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: "current-user",
      };
      onUpdate({ attachments: [...attachments, newAttachment] });
      event.target.value = ""; // Reset input
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      const newAttachment = {
        id: crypto.randomUUID(),
        name: linkName.trim() || linkUrl.trim(),
        url: linkUrl.trim(),
        type: "link",
        size: 0,
        uploadedAt: new Date(),
        uploadedBy: "current-user",
      };
      onUpdate({ attachments: [...attachments, newAttachment] });
      setLinkUrl("");
      setLinkName("");
      setIsAddingLink(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    onUpdate({ 
      attachments: attachments.filter((a) => a.id !== attachmentId) 
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isImageFile = (url: string, type?: string): boolean => {
    if (type?.startsWith("image/")) return true;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || url;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments
        </h3>
        <div className="flex gap-2">
          <Popover open={isAddingLink} onOpenChange={setIsAddingLink}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Link2 className="h-4 w-4 mr-1" />
                Link
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Attach a link</h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="link-url" className="text-xs">
                        URL
                      </Label>
                      <Input
                        id="link-url"
                        placeholder="Paste a link..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddLink();
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-name" className="text-xs">
                        Link name (optional)
                      </Label>
                      <Input
                        id="link-name"
                        placeholder="Name for this link"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddLink();
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingLink(false);
                      setLinkUrl("");
                      setLinkName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddLink} disabled={!linkUrl.trim()}>
                    Attach
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Computer
          </Button>
        </div>
      </div>

      <input
        id="file-input"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {attachments.length > 0 && (
        <div className="space-y-3">
          {attachments.map((attachment) => {
            const isImage = isImageFile(attachment.url, attachment.type);
            const displayName = attachment.name || getFileName(attachment.url);

            return (
              <div key={attachment.id} className="flex gap-3 group">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  {isImage ? (
                    <div className="w-28 h-20 rounded border overflow-hidden bg-muted">
                      <img
                        src={attachment.url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-20 rounded border flex items-center justify-center bg-muted">
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                  >
                    {displayName}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {attachment.uploadedAt && (
                      <span>
                        Added {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {attachment.size > 0 && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(attachment.size)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                    >
                      Delete
                    </Button>
                    <a href={attachment.url} download={displayName}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
