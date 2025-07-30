"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Phone, Calendar, Search, Loader2, Save, Send, ChevronDown, ChevronRight, Edit2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams } from "next/navigation"
import { useFilterParams } from "@/hooks/use-filter-params"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  fetchCustomerCare, 
  sendMessage, 
  fetchCustomerMessages,
  updateCustomerPriority
} from "@/lib/customer-care-api"
import { Customer, getCustomer } from "@/lib/customer-api"
import { CustomerMessage } from "@/types/customer-care"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { getTreatmentsByCustomer, getTreatmentSessions, upsertTreatmentSession } from "@/lib/treatment-api"
import { createAppointment } from "@/lib/appointment-api"
import type { Treatment, TreatmentSession } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"

// Hàm format sản phẩm sử dụng
const formatProductsUsed = (productsUsedStr: string | null) => {
  if (!productsUsedStr) return null
  try {
    const products = JSON.parse(productsUsedStr)
    return products.map((item: any) => {
      const productName = item.product.split(" - ")[1] || item.product
      const usageTimes = item.usage_times.map((time: string) => {
        switch(time) {
          case "morning": return "Sáng"
          case "noon": return "Trưa"
          case "afternoon": return "Chiều"
          case "evening": return "Tối"
          default: return time
        }
      }).join(", ")
      return `${productName} (${usageTimes})`
    }).join("\n")
  } catch {
    return productsUsedStr
  }
}

// Hàm format sản phẩm bán
const formatProductsSold = (productsSoldStr: string | null) => {
  if (!productsSoldStr) return null
  try {
    const products = JSON.parse(productsSoldStr)
    return products.map((item: any) => {
      const productName = item.product.split(" - ")[1] || item.product
      const quantity = item.quantity || 1
      const price = item.price || 0
      const totalPrice = price * quantity
      return `${productName}\nSL: ${quantity} x ${formatCurrency(price)} = ${formatCurrency(totalPrice)}`
    }).join("\n\n")
  } catch {
    return productsSoldStr
  }
}

interface CustomerCareFilters {
  search: string
  priority: string
  selectedCustomerId: string
  selectedTreatmentId: string
  [key: string]: string
}

function CustomerCareContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const [priorityCustomer, setPriorityCustomer] = useState<Customer | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageResult, setMessageResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [editingSession, setEditingSession] = useState<TreatmentSession | null>(null)
  const [editingAfterSalesCare, setEditingAfterSalesCare] = useState("")
  const [editingNextAppointment, setEditingNextAppointment] = useState("")
  const [currentEditingSession, setCurrentEditingSession] = useState<TreatmentSession | null>(null)
  const [appointmentCreated, setAppointmentCreated] = useState<{
    success: boolean
    date: string
    message: string
  } | null>(null)

  const { filters, updateFilters } = useFilterParams<CustomerCareFilters>({
    search: "",
    priority: "",
    selectedCustomerId: "",
    selectedTreatmentId: "",
  })

  // Cập nhật state từ filters
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [treatmentSessions, setTreatmentSessions] = useState<TreatmentSession[]>([])

  // Cập nhật filters khi chọn khách hàng
  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    updateFilters({ 
      selectedCustomerId: customer?.id || "",
      selectedTreatmentId: "" // Reset treatment khi đổi khách hàng
    })
  }

  // Cập nhật filters khi chọn liệu trình
  const handleSelectTreatment = (treatment: Treatment | null) => {
    setSelectedTreatment(treatment)
    updateFilters({ 
      selectedTreatmentId: treatment?.id || "" 
    })
  }

  // Fetch danh sách khách hàng
  const { data: customerCareData, isLoading } = useQuery<{ data: Customer[], pagination?: { total: number } }>({
    queryKey: ["customerCare", page, filters.priority, filters.search],
    queryFn: async () => {
      const customerId = searchParams.get("customerId") || filters.selectedCustomerId
      if (customerId) {
        // Nếu có customerId từ URL hoặc filters, chỉ lấy thông tin của khách hàng đó
        const customer = await getCustomer(customerId)
        return {
          data: customer ? [customer] : [],
          pagination: { total: customer ? 1 : 0 }
        }
      }
      // Ngược lại lấy toàn bộ danh sách như bình thường
      const response = await fetchCustomerCare({
        page,
        limit: 100,
        priority: filters.priority || undefined,
        search: filters.search || undefined
      })
      return {
        data: response.data,
        pagination: { total: response.pagination.total }
      }
    }
  })

  // Tự động chọn khách hàng từ URL hoặc filters
  useEffect(() => {
    const customerId = filters.selectedCustomerId
    if (customerId && customerCareData?.data) {
      const customer = customerCareData.data.find(c => c.id === customerId)
      if (customer) {
        setSelectedCustomer(customer)
      }
    }
  }, [customerCareData, filters.selectedCustomerId])

  // Fetch tin nhắn khi chọn khách hàng
  const { data: messagesData } = useQuery({
    queryKey: ["customerMessages", selectedCustomer?.id],
    queryFn: () => selectedCustomer ? fetchCustomerMessages(selectedCustomer.id) : Promise.resolve([]),
    enabled: !!selectedCustomer
  })

  // Fetch treatments khi chọn khách hàng
  const { data: treatments } = useQuery({
    queryKey: ["customerTreatments", selectedCustomer?.id],
    queryFn: () => selectedCustomer ? getTreatmentsByCustomer(selectedCustomer.id) : Promise.resolve([]),
    enabled: !!selectedCustomer
  })

  // Fetch treatment sessions khi chọn treatment
  const { data: sessions } = useQuery({
    queryKey: ["treatmentSessions", selectedTreatment?.id],
    queryFn: () => selectedTreatment ? getTreatmentSessions(selectedTreatment.id) : Promise.resolve([]),
    enabled: !!selectedTreatment
  })

  useEffect(() => {
    if (sessions) {
      setTreatmentSessions(sessions)
    }
  }, [sessions])

  useEffect(() => {
    // Reset selected treatment when customer changes
    setSelectedTreatment(null)
    setTreatmentSessions([])
  }, [selectedCustomer])

  // Tự động chọn liệu trình từ filters
  useEffect(() => {
    const treatmentId = filters.selectedTreatmentId
    if (treatmentId && treatments) {
      const treatment = treatments.find(t => t.id === treatmentId)
      if (treatment) {
        setSelectedTreatment(treatment)
      }
    }
  }, [treatments, filters.selectedTreatmentId])

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

  // Mutation để cập nhật thông tin buổi điều trị
  const updateSessionMutation = useMutation({
    mutationFn: (sessionData: Partial<TreatmentSession>) => upsertTreatmentSession(sessionData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatmentSessions"] })
      
      toast({
        title: "Đã cập nhật",
        description: "Thông tin buổi điều trị đã được cập nhật",
        variant: "default",
      })
      setEditingSession(null)
      setCurrentEditingSession(null)
    },
    onError: (error) => {
      toast({
        title: "Lỗi cập nhật",
        description: "Không thể cập nhật thông tin. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  })

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCustomer) return

    const form = e.currentTarget
    const formData = new FormData(form)
    setSendingMessage(true)

    try {
      const { webhookStatus } = await sendMessageMutation.mutateAsync({
        customer_id: selectedCustomer.id,
        message_type: formData.get("messageType") as "appointment_reminder" | "post_treatment_care" | "promotion" | "custom",
        message_content: formData.get("messageContent") as string
      })

      setMessageResult({
        success: webhookStatus === 'success',
        message: webhookStatus === 'success' 
          ? "Tin nhắn đã được gửi thành công"
          : "Không thể gửi tin nhắn. Vui lòng thử lại sau."
      })

      if (webhookStatus === 'success') {
        form.reset()
      }
    } catch (error) {
      setMessageResult({
        success: false,
        message: "Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại."
      })
    } finally {
      setSendingMessage(false)
    }
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

  const handleUpdateSessionInfo = async () => {
    if (!editingSession || !currentEditingSession) return

    await updateSessionMutation.mutateAsync({
      id: editingSession.id,
      after_sales_care: editingAfterSalesCare,
      next_appointment: editingNextAppointment || null
    })

    // Tự động tạo lịch hẹn nếu có next_appointment và next_appointment đã thay đổi
    if (editingNextAppointment && 
        selectedCustomer?.id && 
        editingNextAppointment !== currentEditingSession.next_appointment) {
      try {
        await createAppointment({
          customer_id: selectedCustomer.id,
          appointment_date: editingNextAppointment,
          appointment_time: "09:00", // Mặc định 9:00 sáng
          status: "pending",
          notes: `Lịch hẹn tự động được tạo từ buổi điều trị ${editingSession.session_number} - ${selectedTreatment?.treatment_name}`,
          created_by: 1 // Tạm thời hardcode, có thể cần lấy từ context user
        })
        
        // Hiển thị thông báo tạo lịch hẹn thành công
        setAppointmentCreated({
          success: true,
          date: editingNextAppointment,
          message: `Đã tạo lịch hẹn thành công cho ${selectedCustomer.name} vào ngày ${format(new Date(editingNextAppointment), "dd/MM/yyyy", { locale: vi })} lúc 09:00`
        })
      } catch (error) {
        console.error("Lỗi tạo lịch hẹn:", error)
        // Hiển thị thông báo lỗi tạo lịch hẹn
        setAppointmentCreated({
          success: false,
          date: editingNextAppointment,
          message: "Không thể tạo lịch hẹn. Vui lòng thử lại sau."
        })
      }
    }
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
                {isSearching ? (
                  <Loader2 className="absolute left-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                )}
                <Input 
                  placeholder="Tìm theo tên hoặc số điện thoại..." 
                  className="pl-10" 
                  value={filters.search}
                  onChange={(e) => {
                    setIsSearching(true)
                    // Reset các param khác khi search thay đổi
                    updateFilters({ 
                      search: e.target.value,
                      selectedCustomerId: "",
                      selectedTreatmentId: "",
                      priority: filters.priority // Giữ nguyên filter priority
                    })
                    setTimeout(() => setIsSearching(false), 500)
                  }}
                />
              </div>
            </div>
            <select 
              className="p-2 border rounded"
              value={filters.priority}
              onChange={(e) => updateFilters({ 
                priority: e.target.value,
                selectedCustomerId: "",
                selectedTreatmentId: "",
                search: filters.search // Giữ nguyên search term
              })}
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
                    onClick={() => handleSelectCustomer(customer)}
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
                          {(customer.phone)}
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
                      {/* <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Phone className="h-3 w-3 mr-1" />
                        Gọi
                      </Button> */}
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
                    <h4 className="font-medium text-sm">Danh sách liệu trình</h4>
                    {treatments?.map((treatment) => (
                      <div key={treatment.id} className="border rounded-lg">
                        <div
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSelectTreatment(treatment.id === selectedTreatment?.id ? null : treatment)}
                        >
                          <div className="flex-1">
                            <h5 className="font-medium">{treatment.treatment_name}</h5>
                            <p className="text-sm text-muted-foreground">
                              Buổi {treatment.current_session}/{treatment.total_sessions}
                            </p>
                          </div>
                          {treatment.id === selectedTreatment?.id ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>

                        {treatment.id === selectedTreatment?.id && (
                          <div className="border-t p-3 space-y-3">
                            {treatmentSessions.map((session) => (
                              <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    Buổi {session.session_number}
                                  </Badge>
                                  {session.session_date && (
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(session.session_date), "dd/MM/yyyy", { locale: vi })}
                                    </span>
                                  )}
                                </div>
                                {session.skin_condition && (
                                  <p className="text-sm mb-2">
                                    <strong>Tình trạng da:</strong> {session.skin_condition}
                                  </p>
                                )}
                                {session.products_used && (
                                  <div className="text-sm mb-2">
                                    <strong>Sản phẩm sử dụng:</strong>
                                    <div className="mt-1 pl-4 whitespace-pre-line">
                                      {formatProductsUsed(session.products_used)}
                                    </div>
                                  </div>
                                )}
                                {session.products_sold && (
                                  <div className="text-sm mb-2">
                                    <strong>Sản phẩm bán:</strong>
                                    <div className="mt-1 pl-4 whitespace-pre-line">
                                      {formatProductsSold(session.products_sold)}
                                    </div>
                                  </div>
                                )}
                                {session.reaction && (
                                  <p className="text-sm mb-2">
                                    <strong>Phản ứng:</strong> {session.reaction}
                                  </p>
                                )}
                                <div className="text-sm mb-2">
                                  <div className="flex items-center justify-between">
                                    <strong>Chăm sóc sau điều trị:</strong>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => {
                                        setEditingSession(session)
                                        setCurrentEditingSession(session)
                                        setEditingAfterSalesCare(session.after_sales_care || "")
                                        setEditingNextAppointment(session.next_appointment || "")
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {session.after_sales_care ? (
                                    <p className="mt-1">{session.after_sales_care}</p>
                                  ) : (
                                    <p className="text-muted-foreground italic mt-1">Chưa có thông tin</p>
                                  )}
                                </div>
                                <div className="text-sm mb-2">
                                  <div className="flex items-center justify-between">
                                    <strong>Lịch hẹn tiếp theo:</strong>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => {
                                        setEditingSession(session)
                                        setCurrentEditingSession(session)
                                        setEditingAfterSalesCare(session.after_sales_care || "")
                                        setEditingNextAppointment(session.next_appointment || "")
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {session.next_appointment ? (
                                    <p className="mt-1">
                                      {format(new Date(session.next_appointment), "dd/MM/yyyy", { locale: vi })}
                                    </p>
                                  ) : (
                                    <p className="text-muted-foreground italic mt-1">Chưa có lịch hẹn</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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
                      <Button type="submit" className="w-full" disabled={sendingMessage}>
                        {sendingMessage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Gửi tin nhắn
                          </>
                        )}
                      </Button>
                    </form>

                    <AlertDialog open={!!messageResult} onOpenChange={() => setMessageResult(null)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {messageResult?.success ? "Thành công" : "Thất bại"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {messageResult?.message}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction>Đóng</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

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

      {/* Dialog chỉnh sửa thông tin buổi điều trị */}
      <Dialog open={!!editingSession} onOpenChange={(open) => {
        if (!open) {
          setEditingSession(null)
          setCurrentEditingSession(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin buổi điều trị</DialogTitle>
            <DialogDescription>
              Buổi {editingSession?.session_number} - {editingSession?.session_date && format(new Date(editingSession.session_date), "dd/MM/yyyy", { locale: vi })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Chăm sóc sau điều trị</label>
              <Textarea
                value={editingAfterSalesCare}
                onChange={(e) => setEditingAfterSalesCare(e.target.value)}
                placeholder="Nhập nội dung chăm sóc sau điều trị..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Lịch hẹn tiếp theo</label>
              <Input
                type="date"
                value={editingNextAppointment}
                onChange={(e) => setEditingNextAppointment(e.target.value)}
                placeholder="Chọn ngày hẹn tiếp theo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingSession(null)
              setCurrentEditingSession(null)
            }}>
              Hủy
            </Button>
            <Button 
              onClick={handleUpdateSessionInfo}
              disabled={updateSessionMutation.isPending}
            >
              {updateSessionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thông báo tạo lịch hẹn */}
      <AlertDialog open={!!appointmentCreated} onOpenChange={() => setAppointmentCreated(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {appointmentCreated?.success ? "Tạo lịch hẹn thành công" : "Lỗi tạo lịch hẹn"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {appointmentCreated?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Đóng</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CustomerCareLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-10 w-full mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CustomerCarePage() {
  return (
    <Suspense fallback={<CustomerCareLoading />}>
      <CustomerCareContent />
    </Suspense>
  )
}
