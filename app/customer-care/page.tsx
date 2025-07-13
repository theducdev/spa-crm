"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Phone, Calendar, Search, Loader2, Save, Send } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  fetchCustomerCare, 
  fetchCustomerFeedback, 
  createFeedback, 
  sendMessage, 
  fetchCustomerMessages,
  updateCustomerPriority 
} from "@/lib/customer-care-api"
import { Customer } from "@/lib/customer-api"
import { CustomerFeedback, CustomerMessage } from "@/types/customer-care"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { formatCurrency, maskPhoneNumber } from "@/lib/utils"

export default function CustomerCarePage() {
  const { toast } = useToast()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const queryClient = useQueryClient()
  const [priorityCustomer, setPriorityCustomer] = useState<Customer | null>(null)
  const [newFeedbackData, setNewFeedbackData] = useState<{
    type: string;
    content: string;
    reaction?: string;
    nextAppointment?: string;
  } | null>(null)

  // Debounce search term
  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setIsSearching(false)
    }, 500)

    return () => {
      clearTimeout(timer)
      setIsSearching(false)
    }
  }, [searchTerm])

  // Fetch danh sách khách hàng
  const { data: customerCareData, isLoading } = useQuery({
    queryKey: ["customerCare", page, priorityFilter, debouncedSearch],
    queryFn: () => {
      return fetchCustomerCare({
        page,
        limit: 100,
        priority: priorityFilter || undefined,
        search: debouncedSearch || undefined
      })
    }
  })

  // Fetch feedback khi chọn khách hàng
  const { data: feedbackList } = useQuery({
    queryKey: ["customerFeedback", selectedCustomer?.id],
    queryFn: () => selectedCustomer ? fetchCustomerFeedback(selectedCustomer.id) : Promise.resolve([]),
    enabled: !!selectedCustomer
  })

  // Fetch tin nhắn khi chọn khách hàng
  const { data: messagesData } = useQuery({
    queryKey: ["customerMessages", selectedCustomer?.id],
    queryFn: () => selectedCustomer ? fetchCustomerMessages(selectedCustomer.id) : Promise.resolve([]),
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

  // Mutation để cập nhật trạng thái ưu tiên
  const updatePriorityMutation = useMutation({
    mutationFn: ({ customerId, priority }: { customerId: string, priority: 'high' | 'normal' }) => 
      updateCustomerPriority(customerId, priority),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customerCare"] })
      toast({
        title: "Đã cập nhật trạng thái",
        description: `Đã ${variables.priority === 'high' ? 'thêm' : 'bỏ'} ưu tiên cho khách hàng ${data.name}`,
        variant: "default",
      })
    },
    onError: (error) => {
      toast({
        title: "Lỗi cập nhật",
        description: "Không thể cập nhật trạng thái ưu tiên. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  })

  const handleCreateFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCustomer) return

    const form = e.currentTarget
    const formData = new FormData(form)

    setNewFeedbackData({
      type: formData.get("feedbackType") as string,
      content: formData.get("feedbackContent") as string,
      reaction: formData.get("customerReaction") as string,
      nextAppointment: formData.get("nextAppointment") as string
    })
  }

  const handleConfirmFeedback = async () => {
    if (!selectedCustomer || !newFeedbackData) return

    try {
      await createFeedbackMutation.mutateAsync({
        customer_id: selectedCustomer.id,
        feedback_type: newFeedbackData.type as 'treatment' | 'general' | 'follow_up',
        feedback_content: newFeedbackData.content,
        customer_reaction: newFeedbackData.reaction || undefined,
        next_appointment_date: newFeedbackData.nextAppointment || undefined
      })

      // Reset form
      const form = document.querySelector('form') as HTMLFormElement
      if (form) form.reset()
    } finally {
      setNewFeedbackData(null)
    }
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCustomer) return

    const form = e.currentTarget
    const formData = new FormData(form)

    await sendMessageMutation.mutateAsync({
      customer_id: selectedCustomer.id,
      message_type: formData.get("messageType") as "appointment_reminder" | "post_treatment_care" | "promotion" | "custom",
      message_content: formData.get("messageContent") as string
    })

    form.reset()
  }

  const handleTogglePriority = async (customer: Customer) => {
    setPriorityCustomer(customer)
  }

  const handleConfirmPriority = async () => {
    if (!priorityCustomer) return

    const newPriority = priorityCustomer.care_priority === 'high' ? 'normal' : 'high'
    try {
      await updatePriorityMutation.mutateAsync({
        customerId: priorityCustomer.id,
        priority: newPriority
      })
    } finally {
      setPriorityCustomer(null)
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Feedback Dialog */}
      <AlertDialog open={!!newFeedbackData} onOpenChange={(open) => !open && setNewFeedbackData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xác nhận thêm phản hồi
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <div><strong>Khách hàng:</strong> {selectedCustomer?.name}</div>
                <div><strong>Loại phản hồi:</strong> {
                  newFeedbackData?.type === 'treatment' ? 'Sau điều trị' :
                  newFeedbackData?.type === 'general' ? 'Chung' :
                  newFeedbackData?.type === 'follow_up' ? 'Theo dõi' : ''
                }</div>
                <div><strong>Nội dung:</strong> {newFeedbackData?.content}</div>
                {newFeedbackData?.reaction && (
                  <div><strong>Phản ứng:</strong> {newFeedbackData.reaction}</div>
                )}
                {newFeedbackData?.nextAppointment && (
                  <div><strong>Lịch hẹn:</strong> {format(new Date(newFeedbackData.nextAppointment), "dd/MM/yyyy", { locale: vi })}</div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFeedback}>
              {createFeedbackMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Xác nhận'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Priority Dialog */}
      <AlertDialog open={!!priorityCustomer} onOpenChange={(open) => !open && setPriorityCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {priorityCustomer?.care_priority === 'high' 
                ? 'Bỏ ưu tiên khách hàng?' 
                : 'Đặt ưu tiên cho khách hàng?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {priorityCustomer?.care_priority === 'high'
                ? `Bạn có chắc muốn bỏ ưu tiên cho khách hàng ${priorityCustomer?.name}?`
                : `Bạn có chắc muốn đặt ưu tiên cho khách hàng ${priorityCustomer?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPriority}>
              {updatePriorityMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Xác nhận'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                {isSearching ? (
                  <Loader2 className="absolute left-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                <Input 
                  placeholder="Tìm theo tên hoặc số điện thoại..." 
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
                {customerCareData?.data.map((customer: Customer) => (
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
                            {customer.name}
                          </h3>
                          {customer.care_priority === "high" && (
                            <Badge variant="destructive" className="text-xs">
                              Ưu tiên
                            </Badge>
                          )}
                          {customer.tag && (
                            <Badge 
                              className="text-xs"
                              style={{ 
                                backgroundColor: customer.tag.color,
                                color: '#fff'
                              }}
                            >
                              {customer.tag.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {maskPhoneNumber(customer.phone)}
                        </p>
                        {customer.debt > 0 && (
                          <p className="text-xs sm:text-sm text-red-500">
                            Nợ: {formatCurrency(customer.debt)}
                          </p>
                        )}
                      </div>
                      {customer.treatments?.[0] && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {customer.treatments[0].current_session}/{customer.treatments[0].total_sessions}
                        </Badge>
                      )}
                    </div>

                    {customer.treatments?.[0] && (
                      <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                        <p><strong>Liệu trình:</strong> {customer.treatments[0].treatment_name}</p>
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
                      <Button 
                        size="sm" 
                        variant={customer.care_priority === 'high' ? 'destructive' : 'outline'} 
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTogglePriority(customer)
                        }}
                      >
                        {customer.care_priority === 'high' ? 'Bỏ ưu tiên' : 'Ưu tiên'}
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
                    {feedbackList?.map((feedback: CustomerFeedback) => (
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
                        <p className="text-sm mb-2"><strong>Nội dung phản hồi: </strong>{feedback.feedback_content}</p>
                        {feedback.customer_reaction && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Phản ứng:</strong> {feedback.customer_reaction}
                          </p>
                        )}
                        {feedback.next_appointment_date && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Lịch hẹn:</strong>{" "}
                            {format(new Date(feedback.next_appointment_date), "dd/MM/yyyy", { locale: vi })}
                          </p>
                        )}
                      </div>
                    ))}

                    <form onSubmit={handleCreateFeedback} className="space-y-3">
                      <div>
                        <select name="feedbackType" className="w-full p-2 border rounded" required>
                          <option value="treatment">Sau điều trị</option>
                          <option value="general">Chung</option>
                          <option value="follow_up">Theo dõi</option>
                        </select>
                      </div>
                      <div>
                        <textarea
                          name="feedbackContent"
                          placeholder="Nội dung phản hồi..."
                          className="w-full p-2 border rounded"
                          rows={3}
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="customerReaction"
                          placeholder="Phản ứng của khách hàng..."
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Lịch hẹn tiếp theo
                        </div>
                        <input
                          type="date"
                          name="nextAppointment"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        Lưu phản hồi
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Lịch sử tin nhắn</h4>
                    {messagesData?.map((message: CustomerMessage) => (
                      <div key={message.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {message.message_type === "appointment_reminder"
                              ? "Nhắc lịch"
                              : message.message_type === "post_treatment_care"
                              ? "Chăm sóc sau điều trị"
                              : message.message_type === "promotion"
                              ? "Khuyến mãi"
                              : "Tin nhắn"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.sent_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                        </div>
                        <p className="text-sm">{message.message_content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Trạng thái: {message.delivery_status}
                        </p>
                      </div>
                    ))}

                    <form onSubmit={handleSendMessage} className="space-y-3">
                      <div>
                        <select name="messageType" className="w-full p-2 border rounded">
                          <option value="appointment_reminder">Nhắc lịch</option>
                          <option value="post_treatment_care">Chăm sóc sau điều trị</option>
                          <option value="promotion">Khuyến mãi</option>
                          <option value="custom">Tin nhắn khác</option>
                        </select>
                      </div>
                      <div>
                        <textarea
                          name="messageContent"
                          placeholder="Nội dung tin nhắn..."
                          className="w-full p-2 border rounded"
                          rows={3}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Gửi tin nhắn
                      </Button>
                    </form>
                  </div>
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
