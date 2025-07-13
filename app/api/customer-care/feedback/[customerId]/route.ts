import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { customerId } = params

    const { data: feedback, error } = await supabase
      .from('customer_feedback')
      .select(`
        *,
        users (
          id,
          full_name
        ),
        treatment_sessions (
          id,
          session_number,
          session_date
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: feedback })
  } catch (error) {
    console.error('Error in GET feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { customerId } = params

    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found' },
        { status: 401 }
      )
    }

    // Validate customerId exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      console.error('Customer not found:', customerError)
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const {
      feedback_type,
      feedback_content,
      customer_reaction,
      next_appointment_date,
      treatment_session_id
    } = body

    // Validate required fields
    if (!feedback_type || !feedback_content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate feedback_type enum
    if (!['treatment', 'general', 'follow_up'].includes(feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Validate treatment_session_id if provided
    if (treatment_session_id) {
      const { data: session, error: sessionError } = await supabase
        .from('treatment_sessions')
        .select('id')
        .eq('id', treatment_session_id)
        .single()

      if (sessionError || !session) {
        console.error('Invalid treatment session:', sessionError)
        return NextResponse.json(
          { error: 'Invalid treatment session' },
          { status: 400 }
        )
      }
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('customer_feedback')
      .insert({
        customer_id: customerId,
        feedback_type,
        feedback_content,
        customer_reaction,
        next_appointment_date: next_appointment_date || null,
        treatment_session_id: treatment_session_id || null,
        recorded_by: parseInt(userId)
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting feedback:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    // Update customer_care_status if next_appointment_date is provided
    if (next_appointment_date) {
      const { error: updateError } = await supabase
        .from('customer_care_status')
        .update({ next_contact_date: next_appointment_date })
        .eq('customer_id', customerId)

      if (updateError) {
        console.error('Error updating customer care status:', updateError)
        // Don't return error here as the feedback was already created
      }
    }

    return NextResponse.json({ data: feedback })
  } catch (error) {
    console.error('Error in POST feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 