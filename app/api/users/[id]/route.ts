import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase';
import { hashPassword, isAdmin } from '@/lib/auth-utils';
import { getCurrentUser } from '@/app/actions/auth';

// Cập nhật user
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { fullName, password, role, isActive } = await request.json();
    const updates: any = {};

    if (fullName !== undefined) {
      updates.full_name = fullName;
    }

    if (password !== undefined) {
      updates.password_hash = await hashPassword(password);
    }

    if (role !== undefined) {
      if (role !== 'staff' && role !== 'admin') {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      updates.role = role;
    }

    if (isActive !== undefined) {
      updates.is_active = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', params.id)
      .select('id, username, full_name, role, is_active, created_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Xóa user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Không cho phép xóa chính mình
    if (currentUser.userId.toString() === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 