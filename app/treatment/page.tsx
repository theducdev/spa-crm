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
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

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
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [sessions, setSessions] = useState<TreatmentSession[]>([])
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0)
  const [products, setProducts] = useState<Product[]>([])

  // Separate loading states
  const [initialLoading, setInitialLoading] = useState(true)
  const [treatmentLoading, setTreatmentLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<{ before: boolean; after: boolean }>({ before: false, after: false })

  const { toast } = useToast()
  const [canAddNewSession, setCanAddNewSession] = useState(false)

  // Form data
  const [sessionData, setSessionData] = useState({
    session_date: "",
    products_used: "", // Stored as JSON string: [{product: string, usage_times: string[]}]
    skin_condition: "",
    reaction: "",
    next_appointment: "",
    notes: "",
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
        skin_condition: session.skin_condition || "",
        reaction: session.reaction || "",
        next_appointment: session.next_appointment || "",
        notes: session.notes || "",
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
      } else if (data.length > 0) {
        // Load first treatment data if no ID provided
        await loadTreatmentData(data[0].id, false)
        setSelectedTreatment(data[0])
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

      // Load data (will use cache if available)
      await loadTreatmentData(treatmentId, true)
    },
    [treatments, loadTreatmentData],
  )

  const handleSaveSession = async () => {
    if (!selectedTreatment || !sessions[currentSessionIndex]) return

    setSaving(true)
    try {
      const currentSession = sessions[currentSessionIndex]
      
      // Validate and format date fields
      const formattedData = {
        ...sessionData,
        next_appointment: sessionData.next_appointment || undefined, // Convert empty string to undefined
        products_used: sessionData.products_used
      }

      await upsertTreatmentSession({
        id: currentSession.id,
        treatment_id: selectedTreatment.id,
        session_number: currentSession.session_number,
        ...formattedData
      })

      // Tự động tạo lịch hẹn nếu có next_appointment
      if (sessionData.next_appointment && selectedTreatment.customer?.id) {
        await createAppointment({
          customer_id: selectedTreatment.customer.id,
          appointment_date: sessionData.next_appointment,
          appointment_time: "09:00", // Mặc định 9:00 sáng
          status: "pending",
          notes: `Lịch hẹn tự động được tạo từ buổi điều trị ${currentSession.session_number}/${selectedTreatment.total_sessions} - ${selectedTreatment.treatment_name}`
        })
      }

      // Parse products for display
      const productsUsed = JSON.parse(sessionData.products_used || '[]');
      const productsDisplay = productsUsed.map((item: { product: string, usage_times: string[] }) => {
        const times = item.usage_times
          .map(timeId => USAGE_TIMES.find(t => t.id === timeId)?.label || '')
          .filter(Boolean)
          .join(', ');
        return `${item.product}${times ? ` (${times})` : ''}`;
      }).join('\n');

      const message = [
        `Đã lưu thông tin buổi điều trị ${currentSession.session_number}/${selectedTreatment.total_sessions} cho khách hàng ${selectedTreatment.customer?.name || 'N/A'}`,
        productsDisplay && `\nSản phẩm đã sử dụng:\n${productsDisplay}`,
        sessionData.next_appointment && `\nLịch hẹn tiếp theo: ${sessionData.next_appointment} (Đã tự động tạo lịch hẹn)`
      ].filter(Boolean).join('\n');

      // Hiển thị dialog thành công
      setSuccessMessage(message);
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

      await loadTreatmentData(selectedTreatment.id, false)
    }
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
                <TreatmentProgress treatment={selectedTreatment} />
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
          {/* Images Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                Ảnh điều trị
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Before Image */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Ảnh trước điều trị</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                  {beforeImage ? (
                    <div className="relative">
                      <img
                        src={beforeImage.image_url || "/placeholder.svg"}
                        alt="Before treatment"
                        className="w-full aspect-square object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => handleDeleteImage(beforeImage.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-8">
                      {uploading.before ? (
                        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto animate-spin mb-4" />
                      ) : (
                        <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2 sm:mb-4" />
                      )}
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Tải lên ảnh trước điều trị</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload("before", file)
                        }}
                        className="hidden"
                        id="before-upload"
                        disabled={uploading.before}
                      />
                      <label htmlFor="before-upload">
                        <Button variant="outline" asChild size="sm" disabled={uploading.before}>
                          <span>Chọn ảnh</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* After Image */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Ảnh sau điều trị</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                  {afterImage ? (
                    <div className="relative">
                      <img
                        src={afterImage.image_url || "/placeholder.svg"}
                        alt="After treatment"
                        className="w-full aspect-square object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => handleDeleteImage(afterImage.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-8">
                      {uploading.after ? (
                        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto animate-spin mb-4" />
                      ) : (
                        <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-2 sm:mb-4" />
                      )}
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Tải lên ảnh sau điều trị</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload("after", file)
                        }}
                        className="hidden"
                        id="after-upload"
                        disabled={uploading.after}
                      />
                      <label htmlFor="after-upload">
                        <Button variant="outline" asChild size="sm" disabled={uploading.after}>
                          <span>Chọn ảnh</span>
                        </Button>
                      </label>
                    </div>
                  )}
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
                <Label htmlFor="skinCondition">Tình trạng da trước điều trị</Label>
                <Textarea
                  id="skinCondition"
                  placeholder="Mô tả tình trạng da..."
                  rows={2}
                  value={sessionData.skin_condition}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, skin_condition: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="reaction">Phản ứng sau điều trị</Label>
                <Textarea
                  id="reaction"
                  placeholder="Ghi nhận phản ứng của khách hàng..."
                  rows={2}
                  value={sessionData.reaction}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, reaction: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="nextAppointment">Lịch hẹn buổi tiếp theo</Label>
                <Input
                  id="nextAppointment"
                  type="date"
                  value={sessionData.next_appointment}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, next_appointment: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú thêm</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú đặc biệt..."
                  rows={2}
                  value={sessionData.notes}
                  onChange={(e) => setSessionData((prev) => ({ ...prev, notes: e.target.value }))}
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
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
