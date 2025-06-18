import { isAdmin } from '@/lib/auth-utils';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import UserManagement from '@/components/auth/user-management';

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold mb-6">Quản lý người dùng</h1>
      <UserManagement />
    </div>
  );
} 