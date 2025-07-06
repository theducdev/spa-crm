"use client"

import { useEffect, useState } from "react"
import { getStaffAppointments, Appointment } from "@/lib/appointment-api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface StaffAppointment extends Appointment {
  customers?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: number
    full_name: string
  }
}

interface StaffAppointmentsDialogProps {
  staffId: number
  staffName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StaffAppointmentsDialog({
  staffId,
  staffName,
  open,
  onOpenChange,
}: StaffAppointmentsDialogProps) {
  const [appointments, setAppointments] = useState<StaffAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      loadAppointments()
    }
  }, [open, staffId])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const data = await getStaffAppointments(staffId)
      setAppointments(data)
    } catch (error) {
      console.error("Error loading staff appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Lịch hẹn của {staffName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4">
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Không có lịch hẹn nào</div>
          ) : (
            <div className="relative">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {format(new Date(appointment.appointment_date), "dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell>{appointment.appointment_time}</TableCell>
                      <TableCell>{appointment.customers?.name}</TableCell>
                      <TableCell>
                        {appointment.status === "confirmed" && "Đã xác nhận"}
                        {appointment.status === "pending" && "Chờ xác nhận"}
                        {appointment.status === "cancelled" && "Đã hủy"}
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap">{appointment.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 