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
import { format } from "date-fns"
import { vi } from "date-fns/locale"

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
  }
}

interface AppointmentListProps {
  appointments: AppointmentWithCustomer[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function AppointmentList({
  appointments,
  onEdit,
  onDelete,
}: AppointmentListProps) {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Giờ</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ghi chú</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                {format(new Date(appointment.appointment_date), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </TableCell>
              <TableCell>{appointment.appointment_time}</TableCell>
              <TableCell>{appointment.customers?.name}</TableCell>
              <TableCell>
                <span className={getStatusColor(appointment.status)}>
                  {getStatusText(appointment.status)}
                </span>
              </TableCell>
              <TableCell>{appointment.notes}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(appointment.id)}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(appointment.id)}
                  >
                    Xóa
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 