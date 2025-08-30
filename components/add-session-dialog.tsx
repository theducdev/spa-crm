"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createNewTreatmentSession, upsertTreatmentSession } from "@/lib/treatment-api"
import { supabase } from "@/lib/supabase"
import { getProducts, type Product } from "@/lib/product-api"
import type { Treatment } from "@/lib/supabase"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"

interface AddSessionDialogProps {
  treatment: Treatment
  onSessionAdded: () => void
  canAddSession: boolean
}

export function AddSessionDialog({ treatment, onSessionAdded, canAddSession }: AddSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null)
  const { toast } = useToast()

  const [sessionData, setSessionData] = useState({
    session_date: new Date().toISOString().split("T")[0],
    products_used: "",
    skin_condition: "",
    reaction: "",
    next_appointment: "",
    notes: "",
  })

  useEffect(() => {
    if (open) {
      loadProducts()
      loadCurrentUser()
    }
  }, [open])

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/current-user')
      const data = await response.json()
      if (data.user) {
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
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

  const handleCreateSession = async () => {
    if (!treatment || !currentUser) return

    setLoading(true)
    try {
      // Tạo session mới
      const newSession = await createNewTreatmentSession(treatment.id, currentUser.id)

      // Cập nhật thông tin chi tiết của session
      await upsertTreatmentSession({
        id: newSession.id,
        treatment_id: treatment.id,
        session_number: treatment.current_session + 1,
        session_date: sessionData.session_date,
        products_used: sessionData.products_used,
        notes: sessionData.notes
      }, currentUser.id)

      // Tìm và cập nhật lịch hẹn tương ứng (nếu có)
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, status_id")
        .eq("customer_id", treatment.customer_id)
        .eq("appointment_date", sessionData.session_date)
        .eq("treatment_id", treatment.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)

      if (appointments && appointments.length > 0) {
        // Lấy status_id của trạng thái "confirmed"
        const { data: confirmedStatus } = await supabase
          .from("appointment_statuses")
          .select("id")
          .eq("code", "confirmed")
          .single()

        if (confirmedStatus) {
          // Cập nhật trạng thái của lịch hẹn thành đã xác nhận
          await supabase
            .from("appointments")
            .update({ 
              status: "confirmed",
              status_id: confirmedStatus.id 
            })
            .eq("id", appointments[0].id)
        }
      }

      toast({
        title: "Thành công",
        description: `Đã tạo buổi điều trị ${treatment.current_session + 1}`,
      })

      setOpen(false)
      onSessionAdded()
      window.location.reload()

      // Reset form
      setSessionData({
        session_date: new Date().toISOString().split("T")[0],
        products_used: "",
        skin_condition: "",
        reaction: "",
        next_appointment: "",
        notes: "",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo buổi điều trị mới",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canAddSession) {
    return (
      <Button disabled variant="outline" className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Đã hoàn thành liệu trình
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Thêm buổi điều trị
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo buổi điều trị mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <p>
                <strong>Khách hàng:</strong> {treatment.customer?.name}
              </p>
              <p>
                <strong>Liệu trình:</strong> {treatment.treatment_name}
              </p>
              <p>
                <strong>Buổi tiếp theo:</strong> {treatment.current_session + 1}/{treatment.total_sessions}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="session_date">Ngày điều trị</Label>
            <Input
              id="session_date"
              type="date"
              value={sessionData.session_date}
              onChange={(e) => setSessionData((prev) => ({ ...prev, session_date: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="products_used">Sản phẩm dự kiến sử dụng</Label>
            <SearchableCombobox
              options={products.map(product => ({
                value: product.id,
                label: product.name
              }))}
              value={sessionData.products_used || ""}
              onChange={(value) => {
                const selectedProduct = products.find(p => p.id === value);
                setSessionData(prev => ({
                  ...prev,
                  products_used: selectedProduct ? selectedProduct.name : ""
                }));
              }}
              placeholder="Chọn hoặc tìm kiếm sản phẩm..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú cho buổi điều trị..."
              rows={3}
              value={sessionData.notes}
              onChange={(e) => setSessionData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto" disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleCreateSession} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo buổi điều trị
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
