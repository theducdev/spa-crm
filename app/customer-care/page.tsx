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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  fetchCustomerCare, 
  fetchCustomerFeedback, 
  createFeedback, 
  sendMessage, 
  fetchCustomerMessages 
} from "@/lib/customer-care-api"
import { CustomerCareStatus, CustomerFeedback, CustomerMessage } from "@/types/customer-care"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export default function CustomerCarePage() {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCareStatus | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  // Fetch danh sách khách hàng
  const { data: customerCareData, isLoading } = useQuery({
    queryKey: ["customerCare", page, priorityFilter],
    queryFn: () => fetchCustomerCare({
      page,
      limit: 10,
      priority: priorityFilter || undefined
    })
  })

  // Fetch feedback khi chọn khách hàng
  const { data: feedbackData } = useQuery({
    queryKey: ["customerFeedback", selectedCustomer?.customer_id],
    queryFn: () => selectedCustomer ? fetchCustomerFeedback(selectedCustomer.customer_id) : Promise.resolve([]),
    enabled: !!selectedCustomer
  })

  // Fetch tin nhắn khi chọn khách hàng
  const { data: messagesData } = useQuery({
    queryKey: ["customerMessages", selectedCustomer?.customer_id],
    queryFn: () => selectedCustomer ? fetchCustomerMessages(selectedCustomer.customer_id) : Promise.resolve([]),
    enabled: !!selectedCustomer
  })

  // Mutation để tạo feedback mới
  const createFeedbackMutation = useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerFeedback"] })
    }
  })

  // Mutation để gửi tin nhắn
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerMessages"] })
    }
  })

  const handleCreateFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCustomer) return

    const form = e.currentTarget
    const formData = new FormData(form)

    await createFeedbackMutation.mutateAsync({
      customer_id: selectedCustomer.customer_id,
      feedback_type: formData.get("feedbackType") as "treatment" | "general" | "follow_up",
      feedback_content: formData.get("feedbackContent") as string,
      customer_reaction: formData.get("customerReaction") as string,
      next_appointment_date: formData.get("nextAppointment") as string
    })

    form.reset()
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCustomer) return

    const form = e.currentTarget
    const formData = new FormData(form)

    await sendMessageMutation.mutateAsync({
      customer_id: selectedCustomer.customer_id,
      message_type: formData.get("messageType") as "appointment_reminder" | "post_treatment_care" | "promotion" | "custom",
      message_content: formData.get("messageContent") as string
    })

    form.reset()
  }

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
                <Input 
                  placeholder="Tìm kiếm khách hàng..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select 
              className="p-2 border rounded"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="high">Ưu tiên cao</option>
              <option value="normal">Ưu tiên thường</option>
            </select>
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
            {isLoading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {customerCareData?.data.map((customer: CustomerCareStatus) => (
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
                          <h3 className="font-medium text-sm sm:text-base truncate">
                            {customer.customers?.name}
                          </h3>
                          {customer.priority === "high" && (
                            <Badge variant="destructive" className="text-xs">
                              Ưu tiên
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {customer.customers?.phone}
                        </p>
                      </div>
                      {customer.treatments && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {customer.treatments.current_session}/{customer.treatments.total_sessions}
                        </Badge>
                      )}
                    </div>

                    {customer.treatments && (
                      <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                        <p><strong>Liệu trình:</strong> {customer.treatments.treatment_name}</p>
                      </div>
                    )}

                    {customer.next_contact_date && (
                      <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                        <p>
                          <strong>Lịch hẹn:</strong>{" "}
                          {format(new Date(customer.next_contact_date), "dd/MM/yyyy", { locale: vi })}
                        </p>
                      </div>
                    )}

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
            )}
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
                    {feedbackData?.map((feedback: CustomerFeedback) => (
                      <div key={feedback.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          {feedback.treatment_sessions && (
                            <Badge variant="outline" className="text-xs">
                              Buổi {feedback.treatment_sessions.session_number}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(feedback.created_at), "dd/MM/yyyy", { locale: vi })}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <p>
                            <strong>Phản hồi:</strong> {feedback.feedback_content}
                          </p>
                          {feedback.customer_reaction && (
                            <p>
                              <strong>Phản ứng:</strong> {feedback.customer_reaction}
                            </p>
                          )}
                          {feedback.next_appointment_date && (
                            <p>
                              <strong>Lịch hẹn tiếp:</strong>{" "}
                              {format(new Date(feedback.next_appointment_date), "dd/MM/yyyy", { locale: vi })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCreateFeedback} className="space-y-3">
                    <h4 className="font-medium text-sm">Ghi nhận phản hồi mới</h4>
                    <div>
                      <Label htmlFor="feedbackType" className="text-sm">
                        Loại phản hồi
                      </Label>
                      <select
                        id="feedbackType"
                        name="feedbackType"
                        className="w-full p-2 border rounded text-sm"
                        required
                      >
                        <option value="treatment">Sau điều trị</option>
                        <option value="general">Chung</option>
                        <option value="follow_up">Theo dõi</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="feedbackContent" className="text-sm">
                        Nội dung phản hồi
                      </Label>
                      <Textarea
                        id="feedbackContent"
                        name="feedbackContent"
                        placeholder="Ghi nhận phản hồi..."
                        rows={2}
                        className="text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerReaction" className="text-sm">
                        Phản ứng của khách hàng
                      </Label>
                      <Textarea
                        id="customerReaction"
                        name="customerReaction"
                        placeholder="Ghi nhận phản ứng..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nextAppointment" className="text-sm">
                        Lịch hẹn tiếp theo
                      </Label>
                      <Input
                        id="nextAppointment"
                        name="nextAppointment"
                        type="date"
                        className="text-sm"
                      />
                    </div>
                    <Button type="submit" className="w-full" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Lưu phản hồi
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Lịch sử tin nhắn</h4>
                    {messagesData?.map((message: CustomerMessage) => (
                      <div key={message.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {message.message_type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.sent_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                        </div>
                        <p className="text-xs">{message.message_content}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Gửi bởi: {message.users?.full_name}
                          </span>
                          <Badge
                            variant={message.delivery_status === "delivered" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {message.delivery_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <h4 className="font-medium text-sm">Gửi tin nhắn</h4>
                    <div>
                      <Label htmlFor="messageType" className="text-sm">
                        Loại tin nhắn
                      </Label>
                      <select
                        id="messageType"
                        name="messageType"
                        className="w-full p-2 border rounded text-sm"
                        required
                      >
                        <option value="appointment_reminder">Nhắc lịch hẹn</option>
                        <option value="post_treatment_care">Chăm sóc sau điều trị</option>
                        <option value="promotion">Khuyến mãi đặc biệt</option>
                        <option value="custom">Tin nhắn tùy chỉnh</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="messageContent" className="text-sm">
                        Nội dung tin nhắn
                      </Label>
                      <Textarea
                        id="messageContent"
                        name="messageContent"
                        placeholder="Nhập nội dung tin nhắn..."
                        rows={3}
                        className="text-sm"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Gửi tin nhắn
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-muted-foreground">
                Chọn một khách hàng để xem chi tiết
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
