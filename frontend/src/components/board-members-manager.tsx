import { useState } from "react";
import { Users, Plus, Trash2, Mail, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMembers, useCreateMember, useDeleteMember, useUpdateMember } from "@/hooks/use-member";
import { useUserSearch, type UserSearchResult } from "@/hooks/use-user-search";
import { toast } from "sonner";

interface BoardMembersManagerProps {
  boardId: string;
  isOwner: boolean; // Whether current user is board owner
}

export function BoardMembersManager({ boardId, isOwner }: BoardMembersManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [role, setRole] = useState<"member" | "admin" | "viewer">("member");

  const { data: members = [], isLoading } = useMembers(boardId);
  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(
    searchQuery,
    isAddDialogOpen && searchQuery.length >= 2
  );
  const { mutate: createMember, isPending: isCreating } = useCreateMember();
  const { mutate: deleteMember } = useDeleteMember();
  const { mutate: updateMember } = useUpdateMember();

  // Reset form when dialog closes
  useState(() => {
    if (!isAddDialogOpen) {
      setSearchQuery("");
      setSelectedUser(null);
      setRole("member");
    }
  });

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser({
      userId: user.user_id,
      name: user.name || user.nickname || user.email || "Unknown User",
      email: user.email || "",
      avatar: user.picture,
    });
    setSearchQuery("");
  };

  const handleAddMember = () => {
    if (!selectedUser) {
      toast.error("Please select a user to add");
      return;
    }

    // Check if user is already a member
    const isAlreadyMember = members.some(
      (m) => m.userId === selectedUser.userId || m.email === selectedUser.email
    );

    if (isAlreadyMember) {
      toast.error("This user is already a member of the board");
      return;
    }

    createMember(
      {
        boardId,
        userId: selectedUser.userId,
        name: selectedUser.name,
        email: selectedUser.email,
        avatar: selectedUser.avatar || null,
        role,
      },
      {
        onSuccess: () => {
          toast.success(`${selectedUser.name} has been added to the board`);
          setIsAddDialogOpen(false);
          setSelectedUser(null);
          setSearchQuery("");
          setRole("member");
        },
        onError: (error) => {
          toast.error(`Failed to add member: ${error.message}`);
        },
      }
    );
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from the board?`)) {
      deleteMember({ boardId, memberId });
    }
  };

  const handleRoleChange = (memberId: string, newRole: "member" | "admin" | "viewer") => {
    updateMember({
      boardId,
      memberId,
      role: newRole,
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Board Members ({members.length})</h3>
        </div>
        {isOwner && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Search and invite users to join this board
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Selected User Display or Search */}
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <Avatar>
                        <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                        <AvatarFallback>
                          {selectedUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{selectedUser.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedUser.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedUser(null)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={role}
                        onValueChange={(value) =>
                          setRole(value as "member" | "admin" | "viewer")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer (View only)</SelectItem>
                          <SelectItem value="member">Member (Can edit)</SelectItem>
                          <SelectItem value="admin">Admin (Full access)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="search">
                      <UserIcon className="h-4 w-4 inline mr-1" />
                      Search Users
                    </Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                    />
                    
                    {/* Search Results */}
                    {searchQuery.length >= 2 && (
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No users found
                          </div>
                        ) : (
                          <div className="p-2 space-y-1">
                            {searchResults.map((user) => {
                              const displayName =
                                user.name || user.nickname || user.email || "Unknown User";
                              const initials = displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);

                              return (
                                <button
                                  key={user.user_id}
                                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                                  onClick={() => handleSelectUser(user)}
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.picture} alt={displayName} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {displayName}
                                    </p>
                                    {user.email && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {searchQuery.length > 0 && searchQuery.length < 2 && (
                      <p className="text-xs text-muted-foreground">
                        Type at least 2 characters to search
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUser || isCreating}
                >
                  {isCreating ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No members yet</p>
            {isOwner && (
              <p className="text-sm mt-1">
                Click "Add Member" to invite others
              </p>
            )}
          </div>
        ) : (
          members.map((member) => {
            const initials = member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar>
                    <AvatarImage src={member.avatar || undefined} alt={member.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.id, value as "member" | "admin" | "viewer")
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground capitalize px-3">
                      {member.role}
                    </span>
                  )}

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteMember(member.id, member.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
