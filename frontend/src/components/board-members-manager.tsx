import { useState } from "react";
import { Users, Plus, Trash2, X, Mail, User as UserIcon } from "lucide-react";
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
import { uuidv7 } from "uuidv7";

interface BoardMembersManagerProps {
  boardId: string;
  isOwner: boolean; // Whether current user is board owner
}

export function BoardMembersManager({ boardId, isOwner }: BoardMembersManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState<"member" | "admin" | "viewer">("member");

  const { data: members = [], isLoading } = useMembers(boardId);
  const { mutate: createMember, isPending: isCreating } = useCreateMember();
  const { mutate: deleteMember } = useDeleteMember();
  const { mutate: updateMember } = useUpdateMember();

  const handleAddMember = () => {
    if (!email.trim() || !name.trim()) {
      alert("Vui lòng nhập email và tên");
      return;
    }

    // Generate a user ID (in production, this would come from Clerk)
    const userId = uuidv7();

    createMember(
      {
        boardId,
        userId,
        name: name.trim(),
        email: email.trim(),
        avatar: avatarUrl.trim() || null,
        role,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setEmail("");
          setName("");
          setAvatarUrl("");
          setRole("member");
        },
        onError: (error) => {
          alert(`Lỗi khi thêm member: ${error.message}`);
        },
      }
    );
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (confirm(`Bạn có chắc muốn xóa ${memberName} khỏi board?`)) {
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
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Thành viên Board ({members.length})</h3>
        </div>
        {isOwner && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Thêm thành viên
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm thành viên mới</DialogTitle>
                <DialogDescription>
                  Mời người khác tham gia board này
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Tên *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL (optional)</Label>
                  <Input
                    id="avatar"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer (Chỉ xem)</SelectItem>
                      <SelectItem value="member">Member (Chỉnh sửa)</SelectItem>
                      <SelectItem value="admin">Admin (Quản trị)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleAddMember} disabled={isCreating}>
                  {isCreating ? "Đang thêm..." : "Thêm thành viên"}
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
            <p>Chưa có thành viên nào</p>
            {isOwner && (
              <p className="text-sm mt-1">
                Nhấn "Thêm thành viên" để mời người khác
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
                        handleRoleChange(member.id, value as any)
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
