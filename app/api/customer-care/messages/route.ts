import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const {
      customer_id,
      message_type,
      message_content
    } = body

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Tích hợp với service gửi tin nhắn thực tế (SMS/Zalo)
    // Hiện tại chỉ lưu vào database

    const { data: message, error } = await supabase
      .from('customer_messages')
      .insert({
        customer_id,
        message_type,
        message_content,
        sent_by: user.id,
        delivery_status: 'sent' // Giả lập đã gửi thành công
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Cập nhật last_contact_date trong customer_care_status
    await supabase
      .from('customer_care_status')
      .update({ last_contact_date: new Date().toISOString() })
      .eq('customer_id', customer_id)

    return NextResponse.json({ data: message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data: messages, error } = await supabase
      .from('customer_messages')
      .select(`
        *,
        users (
          id,
          full_name
        )
      `)
      .eq('customer_id', customerId)
      .order('sent_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 