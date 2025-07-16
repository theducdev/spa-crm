import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const searchTerm = searchParams.get("q")

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json([])
    }

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase
      .from("customers")
      .select(`
        id,
        name,
        phone
      `)
      .limit(10)

    // Kiểm tra xem searchTerm có phải là số điện thoại không
    const isPhoneNumber = /^\d+$/.test(searchTerm)

    if (isPhoneNumber) {
      query = query.ilike("phone", `%${searchTerm}%`)
    } else {
      query = query.ilike("name", `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error searching customers:", error)
      return NextResponse.json(
        { error: "Lỗi khi tìm kiếm khách hàng", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in search route:", error)
    return NextResponse.json(
      { error: "Lỗi server", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 