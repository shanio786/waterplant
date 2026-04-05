import type { UserRole } from './types';

export interface Session {
  userId: number;
  username: string;
  role: UserRole;
  name: string;
}

const SESSION_KEY = 'wp_session';

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'dev';
}

export function canManageSettings(role: UserRole): boolean {
  return role === 'dev';
}

export function canManageProducts(role: UserRole): boolean {
  return role === 'dev' || role === 'admin';
}
