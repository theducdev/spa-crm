"use client"

import { useEffect, useState, useCallback } from "react"
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
import { Switch } from "@/components/ui/switch"

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
  const [showCreatedAt, setShowCreatedAt] = useState(false)
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getAppointments(
        fromDate && toDate
          ? {
              fromDate,
              toDate,
              filterByCreatedAt: showCreatedAt
            }
          : undefined
      )
      setAppointments(data)
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }, [fromDate, toDate, showCreatedAt])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

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
    if (field === "fromDate") {
      setFromDate(e.target.value)
    } else {
      setToDate(e.target.value)
    }
  }

  // Thêm các nút shortcut
  const setDateRange = (days: number) => {
    const today = new Date()
    setFromDate(format(today, "yyyy-MM-dd"))
    setToDate(format(addDays(today, days), "yyyy-MM-dd"))
  }

  // Thêm hàm xem lịch hẹn hôm nay
  const setToday = () => {
    const today = new Date()
    const todayStr = format(today, "yyyy-MM-dd")
    setFromDate(todayStr)
    setToDate(todayStr)
  }

  // Thêm hàm xem tất cả lịch hẹn
  const showAll = () => {
    setFromDate("")
    setToDate("")
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
              <Label htmlFor="fromDate">
                {showCreatedAt ? "Từ ngày tạo" : "Từ ngày hẹn"}
              </Label>
              <Input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={handleDateChange("fromDate")}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="toDate">
                {showCreatedAt ? "Đến ngày tạo" : "Đến ngày hẹn"}
              </Label>
              <Input
                type="date"
                id="toDate"
                value={toDate}
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
                  setFromDate(format(startOfMonth(today), "yyyy-MM-dd"))
                  setToDate(format(endOfMonth(today), "yyyy-MM-dd"))
                }}
              >
                Tháng này
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 mb-4">
        <Switch
          id="show-created-at"
          checked={showCreatedAt}
          onCheckedChange={setShowCreatedAt}
        />
        <Label htmlFor="show-created-at">
          {showCreatedAt ? "Hiển thị ngày giờ tạo" : "Hiển thị ngày giờ hẹn"}
        </Label>
      </div>

      <AppointmentList
        appointments={appointments}
        onEdit={handleEdit}
        showCreatedAt={showCreatedAt}
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