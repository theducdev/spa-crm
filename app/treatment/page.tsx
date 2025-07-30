"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Upload, Save, Camera, User, Calendar, ChevronLeft, ChevronRight, X, Loader2, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { useToast } from "@/hooks/use-toast"
import { AddSessionDialog } from "@/components/add-session-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"
import {
  getTreatments,
  getTreatmentSessions,
  getTreatment,
  upsertTreatmentSession,
  uploadTreatmentImage,
  deleteTreatmentImage,
  canCreateNewSession,
} from "@/lib/treatment-api"
import { createAppointment } from "@/lib/appointment-api"
import type { Treatment, TreatmentSession } from "@/lib/supabase"
import { TreatmentProgress } from "@/components/treatment-progress"
import { getProducts, type Product } from "@/lib/product-api"
import { maskPhoneNumber } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { supabase } from "@/lib/supabase"

const USAGE_TIMES = [
  { id: "morning", label: "Sáng" },
  { id: "noon", label: "Trưa" },
  { id: "afternoon", label: "Chiều" },
  { id: "evening", label: "Tối" },
  { id: "alternate", label: "Cách ngày" },
]

// Helper function to convert old format to new format
const convertProductsFormat = (productsString: string): string => {
  try {
    // Try to parse as JSON first
    JSON.parse(productsString);
    return productsString;
  } catch {
    // If not valid JSON, convert from old format
    return JSON.stringify(
      productsString
        .split(",")
        .filter(Boolean)
        .map(product => ({
          product: product.trim(),
          usage_times: []
        }))
    );
  }
}

function TreatmentPageContent() {
  const router = useRouter()
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [sessions, setSessions] = useState<TreatmentSession[]>([])
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<Array<{ src: string }>>([])

  // Separate loading states
  const [initialLoading, setInitialLoading] = useState(true)
  const [treatmentLoading, setTreatmentLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<{ before: boolean; after: boolean }>({ before: false, after: false })
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { toast } = useToast()
  const [canAddNewSession, setCanAddNewSession] = useState(false)

  // Form data
  const [sessionData, setSessionData] = useState({
    session_date: "",
    products_used: "", // Stored as JSON string: [{product: string, usage_times: string[]}]
    products_sold: "", // Stored as JSON string: [{product: string, price: number}]
    skin_condition: "",
    reaction: "",
    next_appointment: "",
    notes: "",
    after_sales_care: "", // Thêm trường mới
  })

  // Cache for treatments data to avoid re-fetching
  const [treatmentCache, setTreatmentCache] = useState<
    Map<
      string,
      {
        treatment: Treatment
        sessions: TreatmentSession[]
        canAddSession: boolean
      }
    >
  >(new Map())

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const searchParams = useSearchParams()
  const treatmentId = searchParams.get("id")

  // Load treatments on component mount
  useEffect(() => {
    loadTreatments()
    loadProducts()
    loadCurrentUser()
  }, [])

  // Load selected treatment when ID changes
  useEffect(() => {
    if (treatmentId) {
      loadTreatmentData(treatmentId, true)
    }
  }, [treatmentId])

  // Update form data when session changes
  useEffect(() => {
    if (sessions.length > 0 && sessions[currentSessionIndex]) {
      const session = sessions[currentSessionIndex]
      setSessionData({
        session_date: session.session_date || "",
        products_used: convertProductsFormat(session.products_used || "[]"),
        products_sold: convertProductsFormat(session.products_sold || "[]"),
        skin_condition: session.skin_condition || "",
        reaction: session.reaction || "",
        next_appointment: session.next_appointment || "",
        notes: session.notes || "",
        after_sales_care: session.after_sales_care || "", // Thêm trường mới
      })
    }
  }, [sessions, currentSessionIndex])

  const loadTreatments = async () => {
    try {
      setInitialLoading(true)
      const data = await getTreatments()
      setTreatments(data)
      if (treatmentId) {
        // Load selected treatment data
        await loadTreatmentData(treatmentId, false)
        const selected = data.find(t => t.id === treatmentId)
        if (selected) {
          setSelectedTreatment(selected)
        }
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách liệu trình",
        variant: "destructive",
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await getProducts({ status: "active" })
      setProducts(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      })
    }
  }

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/current-user');
      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  const loadTreatmentData = useCallback(
    async (treatmentId: string, showLoading = true) => {
      // Check cache first
      const cached = treatmentCache.get(treatmentId)
      if (cached) {
        setSelectedTreatment(cached.treatment)
        setSessions(cached.sessions)
        setCanAddNewSession(cached.canAddSession)
        setCurrentSessionIndex(Math.max(0, cached.sessions.length - 1))
        return
      }

      try {
        if (showLoading) {
          setTreatmentLoading(true)
        }

        // Load all data in parallel
        const [treatmentData, sessionsData, canAdd] = await Promise.all([
          getTreatment(treatmentId),
          getTreatmentSessions(treatmentId),
          canCreateNewSession(treatmentId),
        ])

        // Cache the data
        setTreatmentCache((prev) =>
          new Map(prev).set(treatmentId, {
            treatment: treatmentData,
            sessions: sessionsData,
            canAddSession: canAdd,
          }),
        )

        setSelectedTreatment(treatmentData)
        setSessions(sessionsData)
        setCanAddNewSession(canAdd)

        // Set current session index to the latest session
        const latestSessionIndex = Math.max(0, sessionsData.length - 1)
        setCurrentSessionIndex(latestSessionIndex)
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin liệu trình",
          variant: "destructive",
        })
      } finally {
        if (showLoading) {
          setTreatmentLoading(false)
        }
      }
    },
    [treatmentCache, toast],
  )

  const handleTreatmentChange = useCallback(
    async (value: string | string[]) => {
      const treatmentId = Array.isArray(value) ? value[0] : value;
      const treatment = treatments.find((t) => t.id === treatmentId)
      if (!treatment) return

      // Set selected treatment immediately for UI responsiveness
      setSelectedTreatment(treatment)

      // Update URL with treatment ID
      router.push(`/treatment?id=${treatmentId}`)

      // Load data (will use cache if available)
      await loadTreatmentData(treatmentId, true)
    },
    [treatments, loadTreatmentData, router],
  )

  const handleSaveSession = async () => {
    if (!selectedTreatment || !sessions[currentSessionIndex] || !currentUser) return

    setSaving(true)
    try {
      const currentSession = sessions[currentSessionIndex]
      
      // Validate and format date fields
      const formattedData = {
        ...sessionData,
        next_appointment: sessionData.next_appointment || undefined, // Convert empty string to undefined
        products_used: sessionData.products_used,
        products_sold: sessionData.products_sold
      }

      await upsertTreatmentSession({
        id: currentSession.id,
        treatment_id: selectedTreatment.id,
        session_number: currentSession.session_number,
        ...formattedData
      }, currentUser.id)

      // Tự động tạo lịch hẹn nếu có next_appointment và next_appointment đã thay đổi
      if (sessionData.next_appointment && 
          selectedTreatment.customer?.id && 
          sessionData.next_appointment !== currentSession.next_appointment) {
        await createAppointment({
          customer_id: selectedTreatment.customer.id,
          appointment_date: sessionData.next_appointment,
          appointment_time: "09:00", // Mặc định 9:00 sáng
          status: "pending",
          notes: `Lịch hẹn tự động được tạo từ buổi điều trị ${currentSession.session_number}/${selectedTreatment.total_sessions} - ${selectedTreatment.treatment_name}`,
          created_by: currentUser.id
        })
      }

      // Parse products for display
      const productsUsed = JSON.parse(sessionData.products_used || '[]');
      const productsSold = JSON.parse(sessionData.products_sold || '[]');
      
      const productsUsedDisplay = productsUsed.map((item: { product: string, usage_times: string[] }) => {
        const times = item.usage_times
          .map(timeId => USAGE_TIMES.find(t => t.id === timeId)?.label || '')
          .filter(Boolean)
          .join(', ');
        return `${item.product}${times ? ` (${times})` : ''}`;
      }).join('\n');

      const productsSoldDisplay = productsSold.map((item: { product: string, price: number }) => {
        return `${item.product} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)})`;
      }).join('\n');

      // Kiểm tra xem có tạo lịch hẹn mới không
      const isNewAppointment = sessionData.next_appointment && 
        selectedTreatment.customer?.id && 
        sessionData.next_appointment !== currentSession.next_appointment;

      const message = [
        `Đã lưu thông tin buổi điều trị ${currentSession.session_number}/${selectedTreatment.total_sessions} cho khách hàng ${selectedTreatment.customer?.name || 'N/A'}`,
        productsUsedDisplay && `\nSản phẩm đã sử dụng:\n${productsUsedDisplay}`,
        productsSoldDisplay && `\nSản phẩm đã bán:\n${productsSoldDisplay}`,
        isNewAppointment && sessionData.next_appointment && `\nLịch hẹn tiếp theo: ${sessionData.next_appointment} (Đã tự động tạo lịch hẹn)`
      ].filter(Boolean).join('\n');

      let zaloMessage = '';
      // Tự động gửi thông báo Zalo nếu có lịch hẹn tiếp theo
      if (sessionData.next_appointment) {
        try {
          const response = await fetch('https://n8n.tuantoha2.myds.me/webhook/spa-crm/gui-lich-hen', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerName: selectedTreatment.customer?.name,
              customerPhone: selectedTreatment.customer?.phone,
              customerUid_zalo: selectedTreatment.customer?.uid_zalo,
              appointmentDate: sessionData.next_appointment,
              treatmentName: selectedTreatment.treatment_name,
              sessionNumber: currentSession.session_number,
              totalSessions: selectedTreatment.total_sessions,
              products: JSON.parse(sessionData.products_used || '[]')
                .map((item: { product: string, usage_times: string[] }) => ({
                  name: item.product,
                  usageTimes: item.usage_times.map(timeId => 
                    USAGE_TIMES.find(t => t.id === timeId)?.label || ''
                  ).filter(Boolean)
                })),
              productsSold: JSON.parse(sessionData.products_sold || '[]')
                .map((item: { product: string, price: number }) => ({
                  name: item.product,
                  price: item.price
                }))
            })
          });

          const data = await response.json();
          
          // Cập nhật uid_zalo nếu chưa có, bất kể status là gì
          if (selectedTreatment.customer && !selectedTreatment.customer.uid_zalo && data.uid_zalo) {
            const { error: updateError } = await supabase
              .from('customers')
              .update({ uid_zalo: data.uid_zalo })
              .eq('id', selectedTreatment.customer.id);

            if (updateError) {
              throw updateError;
            }
          }

          if (data.status === 'success') {
            zaloMessage = '\n\nĐã tự động gửi thông báo qua Zalo';
          } else {
            zaloMessage = '\n\nKhông thể gửi thông báo qua Zalo';
          }
        } catch (error) {
          console.error('Error sending Zalo notification:', error);
          zaloMessage = '\n\nKhông thể gửi thông báo qua Zalo';
        }
      }

      // Hiển thị dialog thành công
      setSuccessMessage(message + zaloMessage);
      setShowSuccessDialog(true);

      // Clear cache and reload
      setTreatmentCache((prev) => {
        const newCache = new Map(prev)
        newCache.delete(selectedTreatment.id)
        return newCache
      })

      await loadTreatmentData(selectedTreatment.id, false)
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu thông tin buổi điều trị. Vui lòng thử lại.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendToZalo = async () => {
    if (!selectedTreatment || !sessions[currentSessionIndex]) return

    setSending(true)
    setSendStatus('idle')
    try {
      const currentSession = sessions[currentSessionIndex]
      const response = await fetch('https://n8n.tuantoha2.myds.me/webhook/spa-crm/gui-lich-hen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: selectedTreatment.customer?.name,
          customerPhone: selectedTreatment.customer?.phone,
          customerUid_zalo: selectedTreatment.customer?.uid_zalo,
          appointmentDate: sessionData.next_appointment,
          treatmentName: selectedTreatment.treatment_name,
          sessionNumber: currentSession.session_number,
          totalSessions: selectedTreatment.total_sessions,
          products: JSON.parse(sessionData.products_used || '[]')
            .map((item: { product: string, usage_times: string[] }) => ({
              name: item.product,
              usageTimes: item.usage_times.map(timeId => 
                USAGE_TIMES.find(t => t.id === timeId)?.label || ''
              ).filter(Boolean)
            })),
          productsSold: JSON.parse(sessionData.products_sold || '[]')
            .map((item: { product: string, price: number }) => ({
              name: item.product,
              price: item.price
            }))
        })
      });

      const data = await response.json();
      
      // Cập nhật uid_zalo nếu chưa có, bất kể status là gì
      if (selectedTreatment.customer && !selectedTreatment.customer.uid_zalo && data.uid_zalo) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ uid_zalo: data.uid_zalo })
          .eq('id', selectedTreatment.customer.id);

        if (updateError) {
          throw updateError;
        }
      }

      if (data.status === 'success') {
        setSendStatus('success')
      } else {
        setSendStatus('error')
        throw new Error('Không thể gửi tin nhắn đến Zalo của khách hàng')
      }
    } catch (error) {
      setSendStatus('error')
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (type: "before" | "after", file: File) => {
    if (!sessions[currentSessionIndex]) return

    setUploading((prev) => ({ ...prev, [type]: true }))
    try {
      await uploadTreatmentImage(file, sessions[currentSessionIndex].id, type)
      toast({
        title: "Thành công",
        description: `Đã tải lên ảnh ${type === "before" ? "trước" : "sau"} điều trị`,
      })

      // Clear cache and reload
      setTreatmentCache((prev) => {
        const newCache = new Map(prev)
        newCache.delete(selectedTreatment!.id)
        return newCache
      })

      await loadTreatmentData(selectedTreatment!.id, false)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải lên ảnh",
        variant: "destructive",
      })
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }))
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteTreatmentImage(imageId)
      toast({
        title: "Thành công",
        description: "Đã xóa ảnh",
      })

      // Clear cache and reload
      setTreatmentCache((prev) => {
        const newCache = new Map(prev)
        newCache.delete(selectedTreatment!.id)
        return newCache
      })

      await loadTreatmentData(selectedTreatment!.id, false)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa ảnh",
        variant: "destructive",
      })
    }
  }

  const handleSessionAdded = async () => {
    if (selectedTreatment) {
      // Clear cache and reload
      setTreatmentCache((prev) => {
        const newCache = new Map(prev)
        newCache.delete(selectedTreatment.id)
        return newCache
      })

      // Update URL with treatment ID if not already present
      if (!treatmentId) {
        router.push(`/treatment?id=${selectedTreatment.id}`)
      }

      await loadTreatmentData(selectedTreatment.id, false)
      
      // Đảm bảo giữ nguyên treatment đang được chọn
      const updatedTreatment = treatments.find(t => t.id === selectedTreatment.id)
      if (updatedTreatment) {
        setSelectedTreatment(updatedTreatment)
      }
    }
  }

  const handleImageClick = (images: { image_url: string; image_type: string }[], startIndex: number) => {
    const formattedImages = images
      .filter(img => !img.image_url?.toLowerCase().endsWith('.mp4'))
      .map(img => ({
        src: img.image_url || ""
      }))
    setLightboxImages(formattedImages)
    const nonVideoIndex = images.slice(0, startIndex).filter(img => !img.image_url?.toLowerCase().endsWith('.mp4')).length
    setLightboxIndex(nonVideoIndex)
    setLightboxOpen(true)
  }

  const currentSession = sessions[currentSessionIndex]
  const beforeImage = currentSession?.treatment_images?.find((img) => img.image_type === "before")
  const afterImage = currentSession?.treatment_images?.find((img) => img.image_type === "after")

  // Show initial loading only when first loading
  if (initialLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Ghi nhận điều trị</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Treatment Selection */}
          <div className="relative">
            <Combobox
              options={treatments.map(treatment => ({
                value: treatment.id,
                label: `${treatment.customer?.name || 'N/A'} - ${maskPhoneNumber(treatment.customer?.phone)} - ${treatment.treatment_name}`
              }))}
              value={selectedTreatment?.id || ""}
              onValueChange={handleTreatmentChange}
              placeholder="Chọn liệu trình"
              searchPlaceholder="Tìm theo tên hoặc số điện thoại..."
              emptyText="Không tìm thấy liệu trình phù hợp."
              className="w-full sm:w-[350px]"
            />
            {treatmentLoading && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>

          {/* Add Session Button */}
          {selectedTreatment && !treatmentLoading && (
            <AddSessionDialog
              treatment={selectedTreatment}
              onSessionAdded={handleSessionAdded}
              canAddSession={canAddNewSession}
            />
          )}

          {/* Session Navigation */}
          {sessions.length > 0 && !treatmentLoading && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSessionIndex(Math.max(0, currentSessionIndex - 1))}
                disabled={currentSessionIndex === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Badge variant="outline" className="text-sm px-3 py-2 whitespace-nowrap">
                Buổi {currentSessionIndex + 1}/{sessions.length}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSessionIndex(Math.min(sessions.length - 1, currentSessionIndex + 1))}
                disabled={currentSessionIndex === sessions.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content with smooth loading state */}
      {selectedTreatment && (
        <div className={`transition-opacity duration-200 ${treatmentLoading ? "opacity-50" : "opacity-100"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Họ tên</Label>
                  <p className="text-base sm:text-lg font-semibold">{selectedTreatment.customer?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Số điện thoại</Label>
                  <p className="text-base">{maskPhoneNumber(selectedTreatment.customer?.phone)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-base">{selectedTreatment.customer?.email || "Chưa có"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Liệu trình</Label>
                  <p className="text-base font-medium">{selectedTreatment.treatment_name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Tiến độ điều trị
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TreatmentProgress 
                  treatment={selectedTreatment}
                  selectedSession={sessions[currentSessionIndex]?.session_number}
                />
              </CardContent>
            </Card>

            {/* Session Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Tóm tắt buổi điều trị</CardTitle>
              </CardHeader>
              <CardContent>
                {currentSession ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Buổi số</Label>
                      <p className="text-lg font-semibold">
                        {currentSession.session_number}/{selectedTreatment.total_sessions}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Ngày điều trị</Label>
                      <p className="text-base">{currentSession.session_date || "Chưa xác định"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Người tạo</Label>
                      <p className="text-base">{currentSession.creator?.full_name || "Không có thông tin"}</p>
                    </div>
                    {currentSession.next_appointment && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Lịch hẹn tiếp theo</Label>
                        <p className="text-base">{currentSession.next_appointment}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <Badge variant="outline" className="w-full justify-center">
                        {currentSession.session_date ? "Đã thực hiện" : "Chưa thực hiện"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Chưa có buổi điều trị nào</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {currentSession && !treatmentLoading && (
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
          {/* Images/Videos Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                Ảnh/Video điều trị
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Before Images/Videos */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Ảnh/Video trước điều trị</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    {currentSession?.treatment_images
                      ?.filter(img => img.image_type === "before")
                      .map((image, index, filteredImages) => (
                        <div key={image.id} className="relative aspect-square group cursor-pointer"
                             onClick={() => handleImageClick(filteredImages, index)}>
                          {image.image_url?.toLowerCase().endsWith('.mp4') ? (
                            <video
                              src={image.image_url}
                              className="w-full h-full object-cover rounded"
                              controls
                            />
                          ) : (
                            <img
                              src={image.image_url || "/placeholder.svg"}
                              alt="Before treatment"
                              className="w-full h-full object-cover rounded transition-transform group-hover:scale-[1.02]"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteImage(image.id)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                    ))}
                  </div>
                  <div className="text-center py-4">
                    {uploading.before ? (
                      <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto animate-spin mb-4" />
                    ) : (
                      <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2 sm:mb-4" />
                    )}
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Tải lên ảnh hoặc video trước điều trị</p>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/x-m4v,video/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach(file => handleImageUpload("before", file))
                      }}
                      className="hidden"
                      id="before-upload"
                      disabled={uploading.before}
                    />
                    <label htmlFor="before-upload">
                      <Button variant="outline" asChild size="sm" disabled={uploading.before}>
                        <span>Chọn ảnh/video</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* After Images/Videos */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Ảnh/Video sau điều trị</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    {currentSession?.treatment_images
                      ?.filter(img => img.image_type === "after")
                      .map((image, index, filteredImages) => (
                        <div key={image.id} className="relative aspect-square group cursor-pointer"
                             onClick={() => handleImageClick(filteredImages, index)}>
                          {image.image_url?.toLowerCase().endsWith('.mp4') ? (
                            <video
                              src={image.image_url}
                              className="w-full h-full object-cover rounded"
                              controls
                            />
                          ) : (
                            <img
                              src={image.image_url || "/placeholder.svg"}
                              alt="After treatment"
                              className="w-full h-full object-cover rounded transition-transform group-hover:scale-[1.02]"
                            />
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteImage(image.id)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                    ))}
                  </div>
                  <div className="text-center py-4">
                    {uploading.after ? (
                      <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto animate-spin mb-4" />
                    ) : (
                      <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2 sm:mb-4" />
                    )}
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Tải lên ảnh hoặc video sau điều trị</p>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/x-m4v,video/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach(file => handleImageUpload("after", file))
                      }}
                      className="hidden"
                      id="after-upload"
                      disabled={uploading.after}
                    />
                    <label htmlFor="after-upload">
                      <Button variant="outline" asChild size="sm" disabled={uploading.after}>
                        <span>Chọn ảnh/video</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Chi tiết buổi điều trị
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="treatmentDate">Ngày điều trị</Label>
                <Input
                  id="treatmentDate"
                  type="date"
                  value={sessionData.session_date}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, session_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="products">Sản phẩm sử dụng</Label>
                <div className="space-y-4">
                  {JSON.parse(sessionData.products_used || '[]').map((item: { product: string, usage_times: string[] }, index: number) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.product}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const products = JSON.parse(sessionData.products_used || '[]');
                            products.splice(index, 1);
                            setSessionData(prev => ({ ...prev, products_used: JSON.stringify(products) }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Thời điểm sử dụng</Label>
                        <div className="flex flex-wrap gap-2">
                          {USAGE_TIMES.map((time) => (
                            <Button
                              key={time.id}
                              variant={item.usage_times.includes(time.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const products = JSON.parse(sessionData.products_used || '[]');
                                const product = products[index];
                                if (product.usage_times.includes(time.id)) {
                                  product.usage_times = product.usage_times.filter((t: string) => t !== time.id);
                                } else {
                                  product.usage_times.push(time.id);
                                }
                                setSessionData(prev => ({ ...prev, products_used: JSON.stringify(products) }));
                              }}
                            >
                              {time.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Combobox
                    options={products.map(product => ({
                      value: product.id,
                      label: product.name
                    }))}
                    value=""
                    onValueChange={(value) => {
                      const newProducts = Array.isArray(value) ? value : [value];
                      const currentProducts = JSON.parse(sessionData.products_used || '[]');
                      
                      // Tìm thông tin sản phẩm từ ID
                      const productsToAdd = newProducts
                        .map(productId => products.find(p => p.id === productId))
                        .filter(Boolean)
                        .filter(product => 
                          !currentProducts.some((p: { product: string }) => p.product === product?.name)
                        )
                        .map(product => ({
                          product: product?.name || '',
                          usage_times: []
                        }));
                      
                      if (productsToAdd.length > 0) {
                        setSessionData(prev => ({
                          ...prev,
                          products_used: JSON.stringify([...currentProducts, ...productsToAdd])
                        }));
                      }
                    }}
                    placeholder="Chọn hoặc tìm kiếm sản phẩm..."
                    searchPlaceholder="Tìm kiếm sản phẩm..."
                    emptyText="Không tìm thấy sản phẩm phù hợp."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="skin_condition">Tình trạng da</Label>
                <Textarea
                  id="skin_condition"
                  placeholder="Mô tả tình trạng da của khách hàng..."
                  value={sessionData.skin_condition}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, skin_condition: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="reaction">Phản ứng sau điều trị</Label>
                <Textarea
                  id="reaction"
                  placeholder="Ghi chú phản ứng sau điều trị..."
                  value={sessionData.reaction}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, reaction: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="next_appointment">Lịch hẹn tiếp theo</Label>
                <Input
                  id="next_appointment"
                  type="date"
                  value={sessionData.next_appointment}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, next_appointment: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="products_sold">Sản phẩm bán</Label>
                <div className="space-y-4">
                  {JSON.parse(sessionData.products_sold || '[]').map((item: { product: string, price: number }, index: number) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.product}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const products = JSON.parse(sessionData.products_sold || '[]');
                            products.splice(index, 1);
                            setSessionData(prev => ({ ...prev, products_sold: JSON.stringify(products) }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Giá bán</Label>
                        <Input
                          type="text"
                          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price || 0)}
                          onChange={(e) => {
                            const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                            const products = JSON.parse(sessionData.products_sold || '[]');
                            products[index].price = numericValue;
                            setSessionData(prev => ({ ...prev, products_sold: JSON.stringify(products) }));
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                  <Combobox
                    options={products.map(product => ({
                      value: product.id,
                      label: product.name
                    }))}
                    value=""
                    onValueChange={(value) => {
                      const newProducts = Array.isArray(value) ? value : [value];
                      const currentProducts = JSON.parse(sessionData.products_sold || '[]');
                      
                      // Tìm thông tin sản phẩm từ ID
                      const productsToAdd = newProducts
                        .map(productId => products.find(p => p.id === productId))
                        .filter(Boolean)
                        .filter(product => 
                          !currentProducts.some((p: { product: string }) => p.product === product?.name)
                        )
                        .map(product => ({
                          product: product?.name || '',
                          price: 0
                        }));
                      
                      if (productsToAdd.length > 0) {
                        setSessionData(prev => ({
                          ...prev,
                          products_sold: JSON.stringify([...currentProducts, ...productsToAdd])
                        }));
                      }
                    }}
                    placeholder="Chọn hoặc tìm kiếm sản phẩm..."
                    searchPlaceholder="Tìm kiếm sản phẩm..."
                    emptyText="Không tìm thấy sản phẩm phù hợp."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm về buổi điều trị..."
                  value={sessionData.notes}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="after_sales_care">Chăm sóc sau bán</Label>
                <Textarea
                  id="after_sales_care"
                  placeholder="Nhập thông tin chăm sóc sau bán..."
                  value={sessionData.after_sales_care}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, after_sales_care: e.target.value }))}
                />
              </div>

              <div className="pt-4">
                <Button className="w-full" size="lg" onClick={handleSaveSession} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Lưu buổi điều trị
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Lưu thành công
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <pre className="whitespace-pre-wrap text-sm">{successMessage}</pre>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lightbox component */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxImages}
        plugins={[Zoom]}
        animation={{ zoom: 500 }}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 1.2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 500,
          pinchZoomDistanceFactor: 200,
          scrollToZoom: true,
        }}
        carousel={{
          finite: true,
          preload: 2,
        }}
      />
    </div>
  )
}

export default function TreatmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TreatmentPageContent />
    </Suspense>
  )
}
