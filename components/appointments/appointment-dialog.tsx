"use client"

import { useEffect, useState } from "react"
import { getAppointment, createAppointment, updateAppointment, Appointment } from "@/lib/appointment-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"

type FormData = {
  customer_id: string
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "cancelled"
  notes: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId?: string
  onSuccess: () => void
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  onSuccess,
}: AppointmentDialogProps) {
  const isEdit = !!appointmentId
  const [formData, setFormData] = useState<FormData>({
    customer_id: "",
    appointment_date: format(new Date(), "yyyy-MM-dd"),
    appointment_time: "",
    status: "pending",
    notes: "",
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (isEdit && open) {
      loadAppointment()
    }
  }, [isEdit, open])

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name")

      if (error) throw error
      setCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
    }
  }

  const loadAppointment = async () => {
    try {
      const data = await getAppointment(appointmentId!)
      setFormData({
        customer_id: data.customer_id,
        appointment_date: format(new Date(data.appointment_date), "yyyy-MM-dd"),
        appointment_time: data.appointment_time,
        status: data.status,
        notes: data.notes || "",
      })
      // Tìm và set customer đã chọn
      const customer = customers.find(c => c.id === data.customer_id)
      if (customer) {
        setSelectedCustomer(customer)
        setSearchValue(customer.name)
      }
    } catch (error) {
      console.error("Error loading appointment:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit) {
        await updateAppointment(appointmentId!, formData)
      } else {
        await createAppointment(formData)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving appointment:", error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchValue))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa lịch hẹn" : "Thêm lịch hẹn mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Khách hàng</Label>
            <div className="relative">
              <Input
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(false)}
                placeholder="Nhập tên hoặc số điện thoại khách hàng..."
                className="w-full"
              />
              {showSuggestions && searchValue && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={cn(
                          "px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center",
                          selectedCustomer?.id === customer.id && "bg-gray-100"
                        )}
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setFormData({ ...formData, customer_id: customer.id })
                          setSearchValue(customer.name)
                          setShowSuggestions(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div>
                          <div>{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">Không tìm thấy khách hàng</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_date">Ngày hẹn</Label>
            <Input
              id="appointment_date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) =>
                setFormData({ ...formData, appointment_date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_time">Giờ hẹn</Label>
            <Input
              id="appointment_time"
              type="time"
              value={formData.appointment_time}
              onChange={(e) =>
                setFormData({ ...formData, appointment_time: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as "pending" | "confirmed" | "cancelled" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!selectedCustomer}>
              {isEdit ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 