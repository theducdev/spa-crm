"use client"

import { useEffect, useState } from "react"
import { getAppointments, deleteAppointment, Appointment } from "@/lib/appointment-api"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { addDays, format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { vi } from "date-fns/locale"

interface AppointmentWithCustomer extends Appointment {
  customers?: {
    id: string
    name: string
    phone: string
  }
  created_by_user?: {
    id: number
    full_name: string
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>()
  
  // Thêm state cho bộ lọc thời gian
  const [dateFilters, setDateFilters] = useState({
    fromDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    toDate: format(endOfMonth(new Date()), "yyyy-MM-dd")
  })

  useEffect(() => {
    loadAppointments()
  }, [dateFilters]) // Thêm dateFilters vào dependencies

  const loadAppointments = async () => {
    try {
      // Chỉ truyền filters khi có giá trị
      const data = await getAppointments(
        dateFilters.fromDate && dateFilters.toDate 
          ? {
              fromDate: dateFilters.fromDate,
              toDate: dateFilters.toDate
            }
          : undefined
      )
      setAppointments(data)
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }

  const handleEdit = (id: string) => {
    setSelectedAppointmentId(id)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedAppointmentId(undefined)
    setDialogOpen(true)
  }

  // Thêm hàm xử lý thay đổi ngày
  const handleDateChange = (field: "fromDate" | "toDate") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  // Thêm các nút shortcut
  const setDateRange = (days: number) => {
    const today = new Date()
    setDateFilters({
      fromDate: format(today, "yyyy-MM-dd"),
      toDate: format(addDays(today, days), "yyyy-MM-dd")
    })
  }

  // Thêm hàm xem lịch hẹn hôm nay
  const setToday = () => {
    const today = new Date()
    setDateFilters({
      fromDate: format(today, "yyyy-MM-dd"),
      toDate: format(today, "yyyy-MM-dd")
    })
  }

  // Thêm hàm xem tất cả lịch hẹn
  const showAll = () => {
    setDateFilters({
      fromDate: "",
      toDate: ""
    })
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm lịch hẹn
        </Button>
      </div>

      {/* Thêm bộ lọc thời gian */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="fromDate">Từ ngày</Label>
              <Input
                type="date"
                id="fromDate"
                value={dateFilters.fromDate}
                onChange={handleDateChange("fromDate")}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="toDate">Đến ngày</Label>
              <Input
                type="date"
                id="toDate"
                value={dateFilters.toDate}
                onChange={handleDateChange("toDate")}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={showAll}>Tất cả</Button>
              <Button variant="outline" onClick={setToday}>Hôm nay</Button>
              <Button variant="outline" onClick={() => setDateRange(7)}>7 ngày</Button>
              <Button variant="outline" onClick={() => setDateRange(30)}>30 ngày</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const today = new Date()
                  setDateFilters({
                    fromDate: format(startOfMonth(today), "yyyy-MM-dd"),
                    toDate: format(endOfMonth(today), "yyyy-MM-dd")
                  })
                }}
              >
                Tháng này
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AppointmentList
        appointments={appointments}
        onEdit={handleEdit}
      />

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointmentId={selectedAppointmentId}
        onSuccess={loadAppointments}
      />
    </div>
  )
} 