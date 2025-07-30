"use client"

import { Appointment } from "../../lib/appointment-api"
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
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface AppointmentWithCustomer extends Appointment {
  id: string
  customer_id: string
  appointment_date: string
  appointment_time: string
  status: "pending" | "confirmed" | "cancelled"
  notes?: string
  created_at: string
  updated_at: string
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

interface AppointmentListProps {
  appointments: AppointmentWithCustomer[]
  onEdit: (id: string) => void
  onRefresh: () => void
  onDelete?: (id: string) => void
  showCreatedAt?: boolean
}

export function AppointmentList({
  appointments,
  onEdit,
  onRefresh,
  onDelete,
  showCreatedAt = false,
}: AppointmentListProps) {
  const router = useRouter()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-yellow-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận"
      case "cancelled":
        return "Đã hủy"
      default:
        return "Chờ xác nhận"
    }
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

  const handleStatusChange = async (id: string, newStatus: "pending" | "confirmed" | "cancelled") => {
    try {
      setLoadingStates(prev => ({ ...prev, [id]: true }))
      await updateAppointment(id, { status: newStatus })
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
            <TableHead className="w-[120px]">Tag</TableHead>
            <TableHead className="w-[150px]">Nợ</TableHead>
            <TableHead className="w-[120px]">Trạng thái</TableHead>
            <TableHead className="w-[150px]">Nhân viên</TableHead>
            <TableHead className="min-w-[200px]">Ghi chú</TableHead>
            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow 
              key={appointment.id}
              className={cn(
                "group hover:bg-muted/50 transition-colors",
                getRowClassName(appointment.status)
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
                {appointment.customers?.tag && (
                  <div 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${appointment.customers.tag.color}20`,
                      color: appointment.customers.tag.color 
                    }}
                  >
                    {appointment.customers.tag.name}
                  </div>
                )}
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
                    value={appointment.status}
                    onValueChange={(value) => handleStatusChange(appointment.id, value as "pending" | "confirmed" | "cancelled")}
                    disabled={loadingStates[appointment.id]}
                  >
                    <SelectTrigger 
                      className={cn(
                        "border-0 p-0 h-auto bg-transparent hover:bg-transparent focus:ring-0 font-medium",
                        getStatusColor(appointment.status),
                        loadingStates[appointment.id] && "opacity-50"
                      )}
                    >
                      <SelectValue>{getStatusText(appointment.status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="pending" className="text-yellow-600 font-medium">Chờ xác nhận</SelectItem>
                      <SelectItem value="confirmed" className="text-green-600 font-medium">Đã xác nhận</SelectItem>
                      <SelectItem value="cancelled" className="text-red-600 font-medium">Đã hủy</SelectItem>
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 