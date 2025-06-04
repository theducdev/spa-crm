"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Bell, Shield, Database, Save, Upload, Download, Trash2, Eye, EyeOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false,
    appointments: true,
    treatments: true,
    marketing: false,
  })

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    darkMode: false,
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    sessionTimeout: "30",
  })

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">Quản lý cấu hình và tùy chỉnh hệ thống</p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Lưu tất cả
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            <User className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Hồ sơ</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">
            <Bell className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Thông báo</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Bảo mật</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Hệ thống</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs sm:text-sm">
            <Database className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Dữ liệu</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input id="fullName" defaultValue="Quản lý Spa" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="admin@spa.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" defaultValue="0901234567" />
                </div>
                <div>
                  <Label htmlFor="role">Vai trò</Label>
                  <Select defaultValue="admin">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Quản lý</SelectItem>
                      <SelectItem value="staff">Nhân viên</SelectItem>
                      <SelectItem value="technician">Kỹ thuật viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Mô tả</Label>
                <Textarea id="bio" placeholder="Mô tả về bản thân..." rows={3} />
              </div>

              <div>
                <Label>Ảnh đại diện</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Tải lên ảnh mới
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG. Tối đa 2MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Cài đặt thông báo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Phương thức thông báo</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS</Label>
                      <p className="text-sm text-muted-foreground">Nhận thông báo qua tin nhắn</p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, sms: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push notification</Label>
                      <p className="text-sm text-muted-foreground">Thông báo đẩy trên trình duyệt</p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Loại thông báo</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lịch hẹn</Label>
                      <p className="text-sm text-muted-foreground">Thông báo về lịch hẹn mới, hủy, thay đổi</p>
                    </div>
                    <Switch
                      checked={notifications.appointments}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, appointments: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Điều trị</Label>
                      <p className="text-sm text-muted-foreground">Thông báo về tiến độ điều trị</p>
                    </div>
                    <Switch
                      checked={notifications.treatments}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, treatments: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing</Label>
                      <p className="text-sm text-muted-foreground">Thông báo khuyến mãi, tin tức</p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketing: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bảo mật tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Đổi mật khẩu</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input id="newPassword" type="password" placeholder="Nhập mật khẩu mới" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" />
                  </div>
                  <Button>Đổi mật khẩu</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Phiên đăng nhập</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Phiên hiện tại</p>
                      <p className="text-sm text-muted-foreground">Chrome trên Windows • Đang hoạt động</p>
                    </div>
                    <Badge variant="secondary">Hiện tại</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">iPhone Safari</p>
                      <p className="text-sm text-muted-foreground">Đăng nhập 2 giờ trước</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Đăng xuất
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Giao diện</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Chế độ tối</Label>
                      <Switch
                        checked={systemSettings.darkMode}
                        onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, darkMode: checked }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Ngôn ngữ</Label>
                      <Select
                        value={systemSettings.language}
                        onValueChange={(value) => setSystemSettings((prev) => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Hệ thống</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="timezone">Múi giờ</Label>
                      <Select
                        value={systemSettings.timezone}
                        onValueChange={(value) => setSystemSettings((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</SelectItem>
                          <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
                          <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">Thời gian phiên (phút)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => setSystemSettings((prev) => ({ ...prev, sessionTimeout: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Sao lưu tự động</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bật sao lưu tự động</Label>
                    <p className="text-sm text-muted-foreground">Tự động sao lưu dữ liệu hàng ngày</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, autoBackup: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Quản lý dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Sao lưu & Khôi phục</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="h-4 w-4" />
                      <span className="font-medium">Tải xuống dữ liệu</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">Xuất toàn bộ dữ liệu ra file Excel/CSV</p>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="h-4 w-4" />
                      <span className="font-medium">Khôi phục dữ liệu</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">Nhập dữ liệu từ file sao lưu</p>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Lịch sử sao lưu</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sao lưu tự động</p>
                      <p className="text-sm text-muted-foreground">Hôm nay, 02:00 AM • 15.2 MB</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Tải xuống
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sao lưu thủ công</p>
                      <p className="text-sm text-muted-foreground">Hôm qua, 05:30 PM • 14.8 MB</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Tải xuống
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-red-600">Vùng nguy hiểm</h4>
                <div className="border border-red-200 rounded-lg p-4 space-y-3">
                  <div>
                    <h5 className="font-medium text-red-600">Xóa toàn bộ dữ liệu</h5>
                    <p className="text-sm text-muted-foreground">
                      Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu và không thể khôi phục.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tất cả dữ liệu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
