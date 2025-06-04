"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Phone, Calendar, Search, Send, Clock, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CustomerCarePage() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const customers = [
    {
      id: 1,
      name: "Nguyễn Thị A",
      phone: "0901234567",
      treatment: "Điều trị mụn",
      sessions: "3/6",
      nextDate: "2024-06-15",
      lastFeedback: "Khách hàng cảm thấy hài lòng với kết quả",
      status: "active",
      priority: "normal",
    },
    {
      id: 2,
      name: "Trần Văn B",
      phone: "0907654321",
      treatment: "Laser tàn nhang",
      sessions: "5/8",
      nextDate: "2024-06-18",
      lastFeedback: "Có phản ứng nhẹ sau điều trị",
      status: "follow-up",
      priority: "high",
    },
    {
      id: 3,
      name: "Lê Thị C",
      phone: "0912345678",
      treatment: "Căng da mặt",
      sessions: "2/4",
      nextDate: "2024-06-20",
      lastFeedback: "Rất hài lòng với dịch vụ",
      status: "active",
      priority: "normal",
    },
  ]

  const feedbackHistory = [
    {
      date: "2024-06-10",
      session: 3,
      feedback: "Khách hàng cảm thấy da mịn màng hơn, không còn mụn viêm",
      reaction: "Không có phản ứng bất thường",
      nextDate: "2024-06-15",
    },
    {
      date: "2024-06-03",
      session: 2,
      feedback: "Da bắt đầu cải thiện, mụn giảm đáng kể",
      reaction: "Hơi khô da trong 2 ngày đầu",
      nextDate: "2024-06-10",
    },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Chăm sóc khách hàng</h1>
        <Button variant="outline" className="w-full sm:w-auto">
          <MessageCircle className="h-4 w-4 mr-2" />
          Gửi tin nhắn hàng loạt
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm khách hàng..." className="pl-10" />
              </div>
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              Lọc theo ưu tiên
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Layout: Stack vertically */}
      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
        {/* Customer List */}
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Danh sách khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCustomer?.id === customer.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">{customer.name}</h3>
                        {customer.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            Ưu tiên
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {customer.sessions}
                    </Badge>
                  </div>

                  <div className="text-xs sm:text-sm text-muted-foreground mb-2 space-y-1">
                    <p>
                      <strong>Liệu trình:</strong> {customer.treatment}
                    </p>
                    <p>
                      <strong>Lịch hẹn:</strong> {customer.nextDate}
                    </p>
                  </div>

                  <div className="text-xs sm:text-sm mb-3">
                    <p className="line-clamp-2">
                      <strong>Phản hồi:</strong> {customer.lastFeedback}
                    </p>
                  </div>

                  <div className="flex gap-1 sm:gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      Gọi
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Nhắn tin
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Nhắc lịch
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Chi tiết khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <Tabs defaultValue="feedback" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="feedback" className="text-xs sm:text-sm">
                    Phản hồi
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs sm:text-sm">
                    Liên hệ
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="feedback" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Lịch sử phản hồi</h4>
                    {feedbackHistory.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            Buổi {item.session}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.date}</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <p>
                            <strong>Phản hồi:</strong> {item.feedback}
                          </p>
                          <p>
                            <strong>Phản ứng:</strong> {item.reaction}
                          </p>
                          <p>
                            <strong>Lịch hẹn tiếp:</strong> {item.nextDate}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Ghi nhận phản hồi mới</h4>
                    <div>
                      <Label htmlFor="newFeedback" className="text-sm">
                        Phản hồi khách hàng
                      </Label>
                      <Textarea id="newFeedback" placeholder="Ghi nhận phản hồi..." rows={2} className="text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="nextAppointment" className="text-sm">
                        Lịch hẹn tiếp theo
                      </Label>
                      <Input id="nextAppointment" type="date" className="text-sm" />
                    </div>
                    <Button className="w-full" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Lưu phản hồi
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Gửi tin nhắn</h4>
                    <div>
                      <Label htmlFor="messageType" className="text-sm">
                        Loại tin nhắn
                      </Label>
                      <select className="w-full p-2 border rounded text-sm">
                        <option>Nhắc lịch hẹn</option>
                        <option>Chăm sóc sau điều trị</option>
                        <option>Khuyến mãi đặc biệt</option>
                        <option>Tin nhắn tùy chỉnh</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="messageContent" className="text-sm">
                        Nội dung tin nhắn
                      </Label>
                      <Textarea
                        id="messageContent"
                        placeholder="Nhập nội dung tin nhắn..."
                        rows={3}
                        className="text-sm"
                        defaultValue="Xin chào! Spa ABC xin nhắc lịch hẹn điều trị vào ngày 15/06/2024 lúc 10:00. Vui lòng xác nhận. Cảm ơn!"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" className="text-xs">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Zalo
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Send className="h-3 w-3 mr-1" />
                        SMS
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Lịch sử liên hệ</h4>
                    <div className="space-y-2">
                      <div className="p-2 border rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Nhắc lịch hẹn</span>
                          <span className="text-muted-foreground">2024-06-12</span>
                        </div>
                        <p className="text-muted-foreground">Đã gửi qua Zalo - Đã xem</p>
                      </div>
                      <div className="p-2 border rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Chăm sóc sau điều trị</span>
                          <span className="text-muted-foreground">2024-06-10</span>
                        </div>
                        <p className="text-muted-foreground">Đã gửi qua SMS - Đã phản hồi</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Chọn khách hàng để xem chi tiết</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
