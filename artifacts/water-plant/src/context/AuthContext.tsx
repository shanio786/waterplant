import { createContext, useContext, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import { hashPassword, getSession, saveSession, clearSession } from '@/lib/auth';
import type { Session } from '@/lib/auth';

interface AuthContextValue {
  user: Session | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session | null>(() => getSession());

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const hash = await hashPassword(password);
    const dbUser = await db.users.where('username').equalsIgnoreCase(username).first();
    if (!dbUser || dbUser.passwordHash !== hash) return false;
    const session: Session = {
      userId: dbUser.id!,
      username: dbUser.username,
      role: dbUser.role,
      name: dbUser.name,
    };
    saveSession(session);
    setUser(session);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
