"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createNewTreatmentSession } from "@/lib/treatment-api"
import type { Treatment } from "@/lib/supabase"

interface AddSessionDialogProps {
  treatment: Treatment
  onSessionAdded: () => void
  canAddSession: boolean
}

export function AddSessionDialog({ treatment, onSessionAdded, canAddSession }: AddSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [sessionData, setSessionData] = useState({
    session_date: new Date().toISOString().split("T")[0],
    products_used: "",
    skin_condition: "",
    reaction: "",
    next_appointment: "",
    notes: "",
  })

  const handleCreateSession = async () => {
    if (!treatment) return

    setLoading(true)
    try {
      await createNewTreatmentSession(treatment.id)

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
            <Input
              id="products_used"
              placeholder="Nhập tên sản phẩm, liều lượng..."
              value={sessionData.products_used}
              onChange={(e) => setSessionData((prev) => ({ ...prev, products_used: e.target.value }))}
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
