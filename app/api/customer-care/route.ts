import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Authentication đã được xử lý bởi middleware
    const searchParams = new URL(request.url).searchParams
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build base query
    const baseQuery = `
      id,
      customer_id,
      priority,
      status,
      next_contact_date,
      last_contact_date,
      assigned_to,
      notes,
      customers (
        id,
        name,
        phone
      ),
      users (
        id,
        full_name
      )`

    // Build query
    let query = supabase.from('customer_care_status').select(baseQuery, { count: 'exact' })

    // Add filters conditionally
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    // Get total count
    const { count: totalCount, error: countError } = await query

    if (countError) {
      console.error('Error getting count:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Get paginated data with the same filters
    query = supabase.from('customer_care_status').select(baseQuery)
    
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    const { data: customerCare, error: dataError } = await query
      .order('next_contact_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (dataError) {
      console.error('Error fetching data:', dataError)
      return NextResponse.json({ error: dataError.message }, { status: 500 })
    }

    // Get treatment information separately for each customer
    const customerIds = customerCare.map(care => care.customer_id)
    const { data: treatments, error: treatmentsError } = await supabase
      .from('treatments')
      .select('id, treatment_name, total_sessions, current_session, customer_id')
      .in('customer_id', customerIds)

    if (treatmentsError) {
      console.error('Error fetching treatments:', treatmentsError)
      return NextResponse.json({ error: treatmentsError.message }, { status: 500 })
    }

    // Map treatments to customer care records
    const customerCareWithTreatments = customerCare.map(care => ({
      ...care,
      treatments: treatments.filter(t => t.customer_id === care.customer_id)
    }))

    return NextResponse.json({
      data: customerCareWithTreatments,
      pagination: {
        page,
        limit,
        total: totalCount
      }
    })
  } catch (error) {
    console.error('Unexpected error in customer care API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 