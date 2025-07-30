"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
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
import { useFilterParams } from "@/hooks/use-filter-params"
import { Skeleton } from "@/components/ui/skeleton"

interface AppointmentWithCustomer extends Appointment {
  customers?: {
    id: string
    name: string
    phone: string
    debt: number | null
    tag?: {
      id: string
      name: string
      color: string
    }
  }
  created_by_user?: {
    id: number
    full_name: string
  }
}

function AppointmentsContent() {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>()
  
  const { filters, updateFilters } = useFilterParams({
    fromDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    toDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    showCreatedAt: false as boolean | undefined
  })

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getAppointments(
        filters.fromDate && filters.toDate
          ? {
              fromDate: filters.fromDate,
              toDate: filters.toDate,
              filterByCreatedAt: filters.showCreatedAt
            }
          : undefined
      )
      setAppointments(data)
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }, [filters])

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
    updateFilters({ [field]: e.target.value })
  }

  // Thêm các nút shortcut
  const setDateRange = (days: number) => {
    const today = new Date()
    updateFilters({
      fromDate: format(today, "yyyy-MM-dd"),
      toDate: format(addDays(today, days), "yyyy-MM-dd")
    })
  }

  // Thêm hàm xem lịch hẹn hôm nay
  const setToday = () => {
    const today = format(new Date(), "yyyy-MM-dd")
    updateFilters({
      fromDate: today,
      toDate: today
    })
  }

  // Thêm hàm xem tất cả lịch hẹn
  const showAll = () => {
    updateFilters({
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
              <Label htmlFor="fromDate">
                {filters.showCreatedAt ? "Từ ngày tạo" : "Từ ngày hẹn"}
              </Label>
              <Input
                type="date"
                id="fromDate"
                value={filters.fromDate}
                onChange={handleDateChange("fromDate")}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="toDate">
                {filters.showCreatedAt ? "Đến ngày tạo" : "Đến ngày hẹn"}
              </Label>
              <Input
                type="date"
                id="toDate"
                value={filters.toDate}
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
                  updateFilters({
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

      <div className="flex items-center gap-2 mb-4">
        <Switch
          id="show-created-at"
          checked={filters.showCreatedAt}
          onCheckedChange={(checked) => updateFilters({ showCreatedAt: checked })}
        />
        <Label htmlFor="show-created-at">
          {filters.showCreatedAt ? "Hiển thị ngày giờ tạo" : "Hiển thị ngày giờ hẹn"}
        </Label>
      </div>

      <AppointmentList
        appointments={appointments}
        onEdit={handleEdit}
        onRefresh={loadAppointments}
        showCreatedAt={filters.showCreatedAt}
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

function AppointmentsLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-end gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<AppointmentsLoading />}>
      <AppointmentsContent />
    </Suspense>
  )
} 