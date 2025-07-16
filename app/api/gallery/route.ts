import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface Customer {
  id: string
  name: string
}

interface Treatment {
  id: string
  treatment_name: string
  customers: Customer
}

interface TreatmentSession {
  id: string
  session_number: number
  session_date: string
  notes: string
  treatments: Treatment
}

interface TreatmentImage {
  id: string
  image_type: string
  image_url: string
  file_type: string
  created_at: string
  treatment_sessions: TreatmentSession
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const customerId = searchParams.get("customerId")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const treatment = searchParams.get("treatment")
    const imageType = searchParams.get("imageType")

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase
      .from("treatment_images")
      .select(`
        *,
        treatment_sessions!inner (
          *,
          treatments!inner (
            *,
            customers!inner (*)
          )
        )
      `)

    // Áp dụng các bộ lọc
    if (customerId) {
      query = query.eq('treatment_sessions.treatments.customer_id', customerId)
    }

    if (fromDate) {
      query = query.gte('treatment_sessions.session_date', fromDate)
    }

    if (toDate) {
      query = query.lte('treatment_sessions.session_date', toDate)
    }

    if (treatment && treatment !== 'all') {
      query = query.eq('treatment_sessions.treatments.id', treatment)
    }

    if (imageType) {
      const types = imageType.split(',')
      query = query.in('image_type', types)
    }

    // Thêm sắp xếp và giới hạn
    query = query
      .order('created_at', { ascending: false })
      .limit(100)

    const { data: images, error } = await query

    if (error) {
      console.error("Error fetching gallery images:", error)
      return NextResponse.json(
        { error: "Lỗi khi tải dữ liệu ảnh", details: error.message },
        { status: 500 }
      )
    }

    if (!images) {
      return NextResponse.json([])
    }

    return NextResponse.json(images)
  } catch (error) {
    console.error("Error in gallery route:", error)
    return NextResponse.json(
      { error: "Lỗi server", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 