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
import { cn, maskPhoneNumber } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

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
    <div className="rounded-lg border shadow-sm bg-white">
      <ResizablePanelGroup direction="horizontal" className="min-h-[400px]">
        {/* Ngày */}
        <ResizablePanel defaultSize={12} minSize={8}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
              {showCreatedAt ? "Ngày tạo" : "Ngày"}
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tải...</span>
                  </div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Không có lịch hẹn nào trong khoảng thời gian đã chọn
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div 
                    key={appointment.id}
                    className={cn(
                      "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                      getRowClassName(appointment.appointment_status?.code || "")
                    )}
                  >
                    <div className="font-medium text-gray-900">
                      {showCreatedAt 
                        ? format(new Date(appointment.created_at), "dd/MM/yyyy", { locale: vi })
                        : format(new Date(appointment.appointment_date), "dd/MM/yyyy", { locale: vi })
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />

        {/* Giờ */}
        <ResizablePanel defaultSize={8} minSize={6}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
              {showCreatedAt ? "Giờ tạo" : "Giờ"}
            </div>
            <div className="flex-1 overflow-auto">
              {!loading && appointments.length > 0 && appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                    getRowClassName(appointment.appointment_status?.code || "")
                  )}
                >
                  <div className="text-gray-700 font-medium">
                    {showCreatedAt 
                      ? format(new Date(appointment.created_at), "HH:mm", { locale: vi })
                      : appointment.appointment_time
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        {showCreatedAt && (
          <>
            <ResizableHandle withHandle />
            
            {/* Ngày hẹn */}
            <ResizablePanel defaultSize={12} minSize={8}>
              <div className="flex h-full flex-col">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
                  Ngày hẹn
                </div>
                <div className="flex-1 overflow-auto">
                  {!loading && appointments.length > 0 && appointments.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className={cn(
                        "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                        getRowClassName(appointment.appointment_status?.code || "")
                      )}
                    >
                      <div className="font-medium text-gray-900">
                        {format(new Date(appointment.appointment_date), "dd/MM/yyyy", { locale: vi })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Giờ hẹn */}
            <ResizablePanel defaultSize={8} minSize={6}>
              <div className="flex h-full flex-col">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
                  Giờ hẹn
                </div>
                <div className="flex-1 overflow-auto">
                  {!loading && appointments.length > 0 && appointments.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className={cn(
                        "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                        getRowClassName(appointment.appointment_status?.code || "")
                      )}
                    >
                      <div className="text-gray-700 font-medium">
                        {appointment.appointment_time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ResizablePanel>
          </>
        )}

        <ResizableHandle withHandle />

        {/* Khách hàng */}
        <ResizablePanel defaultSize={10} minSize={10}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
              Khách hàng
            </div>
            <div className="flex-1 overflow-auto">
              {!loading && appointments.length > 0 && appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                    getRowClassName(appointment.appointment_status?.code || "")
                  )}
                >
                  <div 
                    className="cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                    onClick={() => router.push(`/customer-care?customerId=${appointment.customers?.id}`)}
                  >
                    <div className="font-medium text-gray-900">{appointment.customers?.name}</div>
                    <div className="text-sm text-gray-600">{maskPhoneNumber(appointment.customers?.phone || null)}</div>
                    <div className="text-xs text-blue-600 font-medium">(Xem CSKH)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Nợ */}
        <ResizablePanel defaultSize={12} minSize={8}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
              Nợ
            </div>
            <div className="flex-1 overflow-auto">
              {!loading && appointments.length > 0 && appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                    getRowClassName(appointment.appointment_status?.code || "")
                  )}
                >
                  <div className={cn(
                    "font-medium",
                    appointment.customers?.debt && appointment.customers.debt > 0 ? "text-red-600" : "text-gray-600"
                  )}>
                    {formatDebt(appointment.customers?.debt || null)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Trạng thái */}
        <ResizablePanel defaultSize={15} minSize={10}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
              Trạng thái
            </div>
            <div className="flex-1 overflow-auto">
              {!loading && appointments.length > 0 && appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                    getRowClassName(appointment.appointment_status?.code || "")
                  )}
                >
                  <div className="flex items-center gap-2 min-w-[110px]">
                    <Select
                      value={appointment.status_id}
                      onValueChange={(value) => handleStatusChange(appointment.id, value)}
                      disabled={loadingStates[appointment.id]}
                    >
                      <SelectTrigger 
                        className={cn(
                          "border-0 p-0 h-auto bg-transparent hover:bg-transparent focus:ring-0 font-medium transition-colors duration-200",
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
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Nhân viên */}
        <ResizablePanel defaultSize={12} minSize={8}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
              Nhân viên
            </div>
            <div className="flex-1 overflow-auto">
              {!loading && appointments.length > 0 && appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                    getRowClassName(appointment.appointment_status?.code || "")
                  )}
                >
                  <div className="truncate text-gray-700 font-medium">
                    {appointment.created_by_user?.full_name || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Ghi chú */}
        <ResizablePanel defaultSize={25} minSize={15}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700">
              Ghi chú
            </div>
            <div className="flex-1 overflow-auto">
              {!loading && appointments.length > 0 && appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center",
                    getRowClassName(appointment.appointment_status?.code || "")
                  )}
                >
                                     <div className="text-gray-600 line-clamp-1">
                     {appointment.notes || "Không có ghi chú"}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Thao tác */}
        <ResizablePanel defaultSize={10} minSize={8}>
          <div className="flex h-full flex-col">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 font-semibold border-b border-gray-200 text-gray-700 text-right">
              Thao tác
            </div>
            <div className="flex-1 overflow-auto">
              {!loading && appointments.length > 0 && appointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 group hover:bg-blue-50/50 transition-all duration-200 h-[72px] flex items-center justify-end",
                    getRowClassName(appointment.appointment_status?.code || "")
                  )}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(appointment.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 hover:text-blue-700"
                  >
                    Sửa
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
} 