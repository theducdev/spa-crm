'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
        });
        router.push('/login');
        router.refresh();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Đang đăng xuất...</p>
    </div>
  );
} 