import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(
  request: Request,
  { params }: { params: { treatmentId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { status_id } = await request.json()

    // Tìm lịch hẹn cuối cùng của treatment và cập nhật
    console.log("Searching appointment for treatment:", params.treatmentId)
    
    // Đầu tiên tìm lịch hẹn cuối cùng
    const { data: appointments, error: findError } = await supabase
      .from('appointments')
      .select('*')
      .eq('treatment_id', params.treatmentId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })

    if (findError) {
      console.error("Error finding appointments:", findError)
      throw findError
    }
    
    console.log("Found appointments:", appointments)

    if (!appointments || appointments.length === 0) {
      console.log("No appointments found")
      return NextResponse.json(
        { error: 'No appointments found' },
        { status: 404 }
      )
    }

    const latestAppointment = appointments[0]
    console.log("Latest appointment to update:", latestAppointment)

    // Sau đó mới cập nhật
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ status_id })
      .eq('id', latestAppointment.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating appointment:", error)
      throw error
    }

    console.log("Successfully updated appointment:", appointment)

    if (error) throw error

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
