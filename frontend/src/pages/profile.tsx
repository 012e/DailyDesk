import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAtom } from "jotai";
import { userPreferencesAtom } from "@/stores/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Bell, 
  Moon, 
  Globe, 
  Lock,
  Trash2,
  Save,
  Camera
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useSearchParams } from "react-router";

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth0();
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [preferences, setPreferences] = useAtom(userPreferencesAtom);
  
  // Get active tab from URL params
  const activeTab = searchParams.get("tab") || "profile";
  
  // Profile form state
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");

  // Sync preferences with local state
  useEffect(() => {
    // This ensures the component re-renders when preferences change
  }, [preferences]);

  const handleSaveProfile = () => {
    // In a real app, this would call an API to update the user profile
    toast.success("Cập nhật thông tin thành công");
  };

  const updateNotificationPreference = (key: keyof typeof preferences.notifications, value: boolean) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    });
    toast.success("Cài đặt đã được lưu");
  };

  const updateLanguage = (lang: string) => {
    setPreferences({ ...preferences, language: lang });
    toast.info("Chức năng đổi ngôn ngữ đang được phát triển");
  };

  const handleDeleteAccount = () => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.")) {
      // In a real app, this would call an API to delete the account
      toast.error("Chức năng xóa tài khoản đang được phát triển");
    }
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="a{activeTab}in rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
            <p className="text-muted-foreground">
              Quản lý thông tin cá nhân và cài đặt của bạn
            </p>
          </div>
        </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile">Thông tin</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin hiển thị của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => toast.info("Chức năng đổi ảnh đại diện đang được phát triển")}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    <User className="inline h-4 w-4 mr-2" />
                    Tên hiển thị
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên hiển thị"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email được quản lý bởi Auth0 và không thể thay đổi
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId">ID người dùng</Label>
                  <Input
                    id="userId"
                    value={user?.sub || ""}
                    disabled
                    className="bg-muted font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDisplayName(user?.name || "")}>
                  Hủy
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Thông báo
              </CardTitle>
              <CardDescription>
                Quản lý cách bạn nhận thông báo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Thông báo qua Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo qua email về hoạt động quan trọng
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.notifications.email}
                  onCheckedChange={(value) => updateNotificationPreference("email", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Thông báo đẩy</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo trên trình duyệt
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.notifications.push}
                  onCheckedChange={(value) => updateNotificationPreference("push", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-reminders">Nhắc nhở công việc</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận nhắc nhở về công việc được giao
                  </p>
                </div>
                <Switch
                  id="task-reminders"
                  checked={preferences.notifications.taskReminders}
                  onCheckedChange={(value) => updateNotificationPreference("taskReminders", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="due-date-reminders">Nhắc nhở hạn chót</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo khi công việc sắp đến hạn
                  </p>
                </div>
                <Switch
                  id="due-date-reminders"
                  checked={preferences.notifications.dueDateReminders}
                  onCheckedChange={(value) => updateNotificationPreference("dueDateReminders", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comment-notifications">Thông báo bình luận</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo khi có người bình luận
                  </p>
                </div>
                <Switch
                  id="comment-notifications"
                  checked={preferences.notifications.comments}
                  onCheckedChange={(value) => updateNotificationPreference("comments", value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Giao diện
              </CardTitle>
              <CardDescription>
                Tùy chỉnh giao diện ứng dụng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Chế độ hiển thị</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="w-full"
                  >
                    Sáng
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="w-full"
                  >
                    Tối
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="w-full"
                  >
                    Hệ thống
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Ngôn ngữ
              </CardTitle>
              <CardDescription>
                Chọn ngôn ngữ hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ</Label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) => updateLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Bảo mật
              </CardTitle>
              <CardDescription>
                Quản lý tài khoản và bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Xác thực</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tài khoản của bạn được bảo vệ bởi Auth0. Để thay đổi mật khẩu hoặc 
                    cài đặt xác thực hai yếu tố, vui lòng truy cập Auth0.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="https://auth0.com" target="_blank" rel="noopener noreferrer">
                      Quản lý bảo mật trên Auth0
                    </a>
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Phiên đăng nhập</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Đăng xuất khỏi tất cả các thiết bị và phiên đăng nhập
                  </p>
                  <Button variant="outline" onClick={handleLogout}>
                    Đăng xuất
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 text-destructive">Vùng nguy hiểm</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Xóa tài khoản của bạn và tất cả dữ liệu liên quan. 
                    Hành động này không thể hoàn tác.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tài khoản
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
