"use client"

import { Appointment } from "../../lib/appointment-api"
import { getAppointmentStatuses, AppointmentStatus } from "../../lib/appointment-status-api"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { updateAppointment } from "@/lib/appointment-api"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface AppointmentWithCustomer extends Appointment {
  id: string
  customer_id: string
  appointment_date: string
  appointment_time: string
  status_id: string
  notes?: string
  created_at: string
  updated_at: string
  appointment_status?: {
    id: string
    code: string
    name: string
    color: string
  }
  customers?: {
    id: string
    name: string
    phone: string
    debt: number | null
  }
  created_by_user?: {
    id: number
    full_name: string
  }
}

interface AppointmentListProps {
  appointments: AppointmentWithCustomer[]
  onEdit: (id: string) => void
  onRefresh: () => void
  onDelete?: (id: string) => void
  showCreatedAt?: boolean
  loading?: boolean
}

export function AppointmentList({
  appointments,
  onEdit,
  onRefresh,
  onDelete,
  showCreatedAt = false,
  loading = false,
}: AppointmentListProps) {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [appointmentStatuses, setAppointmentStatuses] = useState<AppointmentStatus[]>([])

  // Load appointment statuses
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const statuses = await getAppointmentStatuses()
        setAppointmentStatuses(statuses)
      } catch (error) {
        console.error("Error loading appointment statuses:", error)
      }
    }
    loadStatuses()
  }, [])

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case "confirmed":
        return "text-green-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-yellow-600"
    }
  }

  const getStatusText = (appointment: AppointmentWithCustomer) => {
    return appointment.appointment_status?.name || "Không xác định"
  }

  const getRowClassName = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100"
      default:
        return ""
    }
  }

  const formatDebt = (debt: number | null) => {
    if (debt === null || debt === 0) return "Không có nợ"
    return new Intl.NumberFormat("vi-VN", { 
      style: "currency", 
      currency: "VND" 
    }).format(debt)
  }

  const handleStatusChange = async (id: string, newStatusId: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [id]: true }))
      await updateAppointment(id, { status_id: newStatusId })
      onRefresh()
    } catch (error) {
      console.error("Error updating appointment status:", error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px]">{showCreatedAt ? "Ngày tạo" : "Ngày"}</TableHead>
            <TableHead className="w-[80px]">{showCreatedAt ? "Giờ tạo" : "Giờ"}</TableHead>
            {showCreatedAt && (
              <>
                <TableHead className="w-[100px]">Ngày hẹn</TableHead>
                <TableHead className="w-[80px]">Giờ hẹn</TableHead>
              </>
            )}
            <TableHead className="w-[180px]">Khách hàng</TableHead>
            <TableHead className="w-[150px]">Nợ</TableHead>
            <TableHead className="w-[120px]">Trạng thái</TableHead>
            <TableHead className="w-[150px]">Nhân viên</TableHead>
            <TableHead className="min-w-[200px]">Ghi chú</TableHead>
            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={showCreatedAt ? 9 : 7} className="p-8 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tải...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCreatedAt ? 9 : 7} className="p-8 text-center text-muted-foreground">
                Không có lịch hẹn nào trong khoảng thời gian đã chọn
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => (
            <TableRow 
              key={appointment.id}
              className={cn(
                "group hover:bg-muted/50 transition-colors",
                getRowClassName(appointment.appointment_status?.code || "")
              )}
            >
              <TableCell className="font-medium">
                {showCreatedAt 
                  ? format(new Date(appointment.created_at), "dd/MM/yyyy", { locale: vi })
                  : format(new Date(appointment.appointment_date), "dd/MM/yyyy", { locale: vi })
                }
              </TableCell>
              <TableCell>
                {showCreatedAt 
                  ? format(new Date(appointment.created_at), "HH:mm", { locale: vi })
                  : appointment.appointment_time
                }
              </TableCell>
              {showCreatedAt && (
                <>
                  <TableCell className="font-medium">
                    {format(new Date(appointment.appointment_date), "dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                  <TableCell>
                    {appointment.appointment_time}
                  </TableCell>
                </>
              )}
              <TableCell className="font-medium truncate">
                <div 
                  className="cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1"
                  onClick={() => router.push(`/customer-care?customerId=${appointment.customers?.id}`)}
                >
                  {appointment.customers?.name}
                  <span className="text-xs text-muted-foreground">(Xem CSKH)</span>
                </div>
              </TableCell>
              <TableCell>
                <div className={cn(
                  appointment.customers?.debt && appointment.customers.debt > 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {formatDebt(appointment.customers?.debt || null)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[110px]">
                  <Select
                    value={appointment.status_id}
                    onValueChange={(value) => handleStatusChange(appointment.id, value)}
                    disabled={loadingStates[appointment.id]}
                  >
                    <SelectTrigger 
                      className={cn(
                        "border-0 p-0 h-auto bg-transparent hover:bg-transparent focus:ring-0 font-medium",
                        getStatusColor(appointment.appointment_status?.code || ""),
                        loadingStates[appointment.id] && "opacity-50"
                      )}
                    >
                      <SelectValue>{getStatusText(appointment)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {appointmentStatuses.map((status) => (
                        <SelectItem 
                          key={status.id} 
                          value={status.id} 
                          className={`text-${status.color}-600 font-medium`}
                        >
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingStates[appointment.id] && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </TableCell>
              <TableCell className="truncate">
                {appointment.created_by_user?.full_name || "N/A"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <div className="line-clamp-1">
                  {appointment.notes}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(appointment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Sửa
                </Button>
              </TableCell>
            </TableRow>
          ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 