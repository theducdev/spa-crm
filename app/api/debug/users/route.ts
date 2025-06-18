import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase';

export async function GET() {
  try {
    console.log('Debug - Starting users query');
    const supabase = createClient();
    
    // Kiểm tra kết nối
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('count');

    if (tablesError) {
      console.error('Debug - Table check error:', tablesError);
      return NextResponse.json({
        error: 'Database connection error',
        details: tablesError.message,
        hint: 'Check if the users table exists and Supabase connection is correct'
      }, { status: 500 });
    }

    // Lấy danh sách users
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Debug - Get users error:', error);
      return NextResponse.json({
        error: 'Query error',
        details: error.message
      }, { status: 500 });
    }

    console.log('Debug - Users found:', users?.length || 0);
    return NextResponse.json({
      users,
      debug: {
        timestamp: new Date().toISOString(),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Debug - Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 