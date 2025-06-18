import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

// Các route không cần xác thực
const publicRoutes = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Bỏ qua các route công khai
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Kiểm tra token trong cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Nếu là API route, trả về lỗi 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Nếu là route thông thường, chuyển hướng đến trang đăng nhập với thông báo
    const url = new URL('/login', request.url);
    url.searchParams.set('message', 'Vui lòng đăng nhập để tiếp tục');
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Xác thực token
    await verifyToken(token);
    return NextResponse.next();
  } catch (error) {
    // Token không hợp lệ
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const url = new URL('/login', request.url);
    url.searchParams.set('message', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
}

// Chỉ áp dụng middleware cho các route cần thiết
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 