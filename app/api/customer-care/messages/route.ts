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

    // Lấy user ID từ request headers (được set bởi middleware)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      )
    }

    // Lấy thông tin khách hàng
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('name, phone, uid_zalo')
      .eq('id', customer_id)
      .single()

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 })
    }

    // Gọi webhook để gửi tin nhắn
    const webhookResponse = await fetch('https://n8n.tuantoha2.myds.me/webhook/spa-crm/gui-tin-nhan-cham-soc-khach-hang', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerUid_zalo: customer.uid_zalo,
        messageContent: message_content
      })
    })

    const webhookData = await webhookResponse.json()

    // Lưu tin nhắn vào database với trạng thái dựa vào response từ webhook
    const { data: message, error } = await supabase
      .from('customer_messages')
      .insert({
        customer_id,
        message_type,
        message_content,
        sent_by: parseInt(userId),
        delivery_status: webhookData.status === 'success' ? 'sent' : 'failed'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Cập nhật uid_zalo nếu chưa có và webhook trả về uid mới
    if (!customer.uid_zalo && webhookData.uid_zalo) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ uid_zalo: webhookData.uid_zalo })
        .eq('id', customer_id)

      if (updateError) {
        console.error('Error updating uid_zalo:', updateError)
      }
    }

    // Cập nhật last_contact_date trong customer_care_status
    await supabase
      .from('customer_care_status')
      .update({ last_contact_date: new Date().toISOString() })
      .eq('customer_id', customer_id)

    return NextResponse.json({ 
      data: message,
      webhookStatus: webhookData.status
    })
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