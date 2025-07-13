import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { priority } = await request.json()

    // Validate priority
    if (!['high', 'normal'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      )
    }

    // Update customer priority
    const { data, error } = await supabase
      .from('customers')
      .update({ care_priority: priority })
      .eq('id', params.customerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer priority:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in update priority API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 