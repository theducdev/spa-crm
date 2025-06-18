import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
);

export interface JWTPayload {
  userId: number;
  username: string;
  role: 'staff' | 'admin';
  [key: string]: any; // Add index signature for jose compatibility
}

export async function hashPassword(password: string): Promise<string> {
  const hashedPassword = await hash(password, 10);
  console.log('Hashing password:', {
    original: password,
    hashed: hashedPassword
  });
  return hashedPassword;
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  console.log('Comparing passwords:', {
    provided: password,
    storedHash: hashedPassword
  });
  const result = await compare(password, hashedPassword);
  console.log('Password comparison result:', result);
  return result;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as unknown as JWTPayload;
}

export function isAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'admin';
}

export function isAuthenticated(user: JWTPayload | null): boolean {
  return user !== null;
} 