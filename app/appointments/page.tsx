"use client"

import { useEffect, useState } from "react"
import { getAppointments, deleteAppointment, Appointment } from "@/lib/appointment-api"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { AppointmentList } from "@/components/appointments/appointment-list"

interface AppointmentWithCustomer extends Appointment {
  customers?: {
    id: string
    name: string
    phone: string
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithCustomer[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>()

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const data = await getAppointments()
      setAppointments(data)
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa lịch hẹn này?")) {
      try {
        await deleteAppointment(id)
        loadAppointments()
      } catch (error) {
        console.error("Error deleting appointment:", error)
      }
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

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm lịch hẹn
        </Button>
      </div>

      <AppointmentList
        appointments={appointments}
        onEdit={handleEdit}
        onDelete={handleDelete}
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