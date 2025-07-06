import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: sessions, error } = await supabase
      .from('treatment_sessions')
      .select(`
        id,
        created_at,
        products_sold,
        treatment_id,
        treatments:treatments!inner (
          id,
          customer_id,
          customers:customers!inner (
            id,
            name
          )
        )
      `)
      .not('products_sold', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sold products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json([])
    }

    // Transform data structure
    const formattedSessions = sessions.map(session => {
      const customerName = session.treatments?.customers?.name
      return {
        id: session.id,
        created_at: session.created_at,
        customer_name: customerName || 'Không có thông tin',
        products_sold: typeof session.products_sold === 'string' ? 
          JSON.parse(session.products_sold) : 
          []
      }
    })

    return NextResponse.json(formattedSessions)
  } catch (error) {
    console.error('Internal server error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 