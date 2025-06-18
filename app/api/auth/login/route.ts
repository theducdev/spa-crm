import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { comparePasswords, createToken } from '@/lib/auth-utils';
import { createClient } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    console.log('Login attempt:', { username });

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Tìm user trong database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password_hash, role, is_active')
      .eq('username', username)
      .single();

    console.log('Database query result:', {
      userFound: !!user,
      error: error?.message,
      passwordHashIfFound: user?.password_hash
    });

    if (error || !user) {
      console.log('User not found or database error:', error);
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      console.log('Account is disabled');
      return NextResponse.json(
        { error: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    // Kiểm tra password
    console.log('Starting password comparison...');
    const isValidPassword = await comparePasswords(password, user.password_hash);
    console.log('Password validation result:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Tạo JWT token
    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Tạo response
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    // Set cookie trong response
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    console.log('Login successful for user:', user.username);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
} 