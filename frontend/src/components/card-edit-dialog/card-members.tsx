
import { useState } from "react";
import { User, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { Card, Member } from "@/types/card";
import { cn } from "@/lib/utils";
import { useMembers } from "@/hooks/use-member";

interface CardMembersProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
  boardId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
  ownerInfo?: { userId: string; name: string; email: string; avatar?: string | null };
}

export function CardMembers({ card, onUpdate, boardId, isOpen: controlledIsOpen, onOpenChange: controlledOnOpenChange, triggerButton, ownerInfo }: CardMembersProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch available members from API
  const { data: availableMembersData = [] } = useMembers(boardId);

  // Ensure members is always an array (defensive programming)
  const members = Array.isArray(card.members) ? card.members : [];

  // Convert board members to card member format
  const availableMembers: Member[] = availableMembersData.map((member) => ({
    id: member.userId, // Use userId as id for card members
    name: member.name,
    email: member.email,
    avatar: member.avatar || undefined,
    initials: member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  }));

  // Add owner to available members if not already present
  if (ownerInfo) {
    const isOwnerInMembers = availableMembers.some(m => m.id === ownerInfo.userId);
    if (!isOwnerInMembers) {
      availableMembers.unshift({
        id: ownerInfo.userId,
        name: ownerInfo.name,
        email: ownerInfo.email,
        avatar: ownerInfo.avatar || undefined,
        initials: ownerInfo.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      });
    }
  }

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnOpenChange || setInternalIsOpen;

  const handleToggleMember = (member: Member) => {
    const isMember = members.some((m) => m.id === member.id);

    if (isMember) {
      // Remove member
      onUpdate({
        members: members.filter((m) => m.id !== member.id),
      });
    } else {
      // Add member
      onUpdate({
        members: [...members, member],
      });
    }
  };

  const handleRemoveMember = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      members: members.filter((m) => m.id !== memberId),
    });
  };

  const isMember = (memberId: string) => {
    return members.some((m) => m.id === memberId);
  };

  // Filter members based on search query
  const filteredMembers = availableMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Popover content to be reused
  const popoverContent = (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold mb-1">Members</h4>
        <p className="text-xs text-muted-foreground">
          Assign members to this card
        </p>
      </div>

      {/* Search */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search members..."
        className="h-8"
      />

      {/* Members list */}
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No members found
          </p>
        ) : (
          filteredMembers.map((member) => {
            const isSelected = isMember(member.id);

            return (
              <button
                key={member.id}
                onClick={() => handleToggleMember(member)}
                className={cn(
                  "w-full flex items-center gap-3 rounded px-2 py-2 text-sm hover:bg-muted transition-colors"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
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
            <h3 className="font-semibold text-sm">Members</h3>
          </div>

          {/* Members display */}
          <div className="flex items-center gap-2 flex-wrap">
            {members.map((member) => (
              <div
                key={member.id}
                className="group relative"
                title={`${member.name} (${member.email})`}
              >
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={(e) => handleRemoveMember(member.id, e)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                {popoverContent}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Custom trigger version */}
      {triggerButton && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            {popoverContent}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
