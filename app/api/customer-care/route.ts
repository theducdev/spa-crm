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
    const search = searchParams.get('search')?.trim()
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    // Build base query
    const baseQuery = `
      id,
      name,
      phone,
      email,
      gender,
      birth_date,
      address,
      notes,
      status,
      care_priority,
      tag:customer_tags (
        id,
        name,
        color
      ),
      debt`

    // Build query
    let query = supabase.from('customers').select(baseQuery, { count: 'exact' })

    // Add filters conditionally
    if (priority) {
      query = query.eq('care_priority', priority)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      // Tối ưu search: tách từ khóa và tìm kiếm chính xác hơn
      const searchTerms = search.split(' ').filter(Boolean)
      searchTerms.forEach(term => {
        const phoneSearch = term.replace(/\D/g, '') // Chỉ giữ lại số
        if (phoneSearch) {
          query = query.filter('phone', 'ilike', `%${phoneSearch}%`)
        } else {
          // Sử dụng textSearch để tìm kiếm tiếng Việt tốt hơn
          query = query.filter('name', 'ilike', `%${term}%`)
        }
      })
    }

    // Get total count
    const { count: totalCount, error: countError } = await query

    if (countError) {
      console.error('Error getting count:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Get paginated data with the same filters
    query = supabase.from('customers').select(baseQuery)
    
    if (priority) {
      query = query.eq('care_priority', priority)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      // Áp dụng cùng điều kiện search
      const searchTerms = search.split(' ').filter(Boolean)
      searchTerms.forEach(term => {
        const phoneSearch = term.replace(/\D/g, '')
        if (phoneSearch) {
          query = query.filter('phone', 'ilike', `%${phoneSearch}%`)
        } else {
          query = query.filter('name', 'ilike', `%${term}%`)
        }
      })
    }

    const { data: customers, error: dataError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (dataError) {
      console.error('Error fetching data:', dataError)
      return NextResponse.json({ error: dataError.message }, { status: 500 })
    }

    // Get treatment information for each customer
    const customerIds = customers.map(customer => customer.id)
    const { data: treatments, error: treatmentsError } = await supabase
      .from('treatments')
      .select('id, treatment_name, total_sessions, current_session, customer_id')
      .in('customer_id', customerIds)
      .eq('status', 'active')

    if (treatmentsError) {
      console.error('Error fetching treatments:', treatmentsError)
      return NextResponse.json({ error: treatmentsError.message }, { status: 500 })
    }

    // Map treatments to customers
    const customersWithTreatments = customers.map(customer => ({
      ...customer,
      treatments: treatments.filter(t => t.customer_id === customer.id)
    }))

    return NextResponse.json({
      data: customersWithTreatments,
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