'use server';

import { cookies } from 'next/headers';
import { verifyToken, type JWTPayload } from '@/lib/auth-utils';

export async function getAuthToken(): Promise<string | undefined> {
  return cookies().get('auth-token')?.value;
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const token = await getAuthToken();
    if (!token) return null;
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function getLoginStatus(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
} 