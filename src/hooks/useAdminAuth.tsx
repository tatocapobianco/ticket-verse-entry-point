import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { adminRpc, ADMIN_IDLE_MS } from '@/lib/admin';

interface AdminAuthState {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  email: string | null;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);
const IDLE_KEY = 'cupo_admin_last_activity';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checking = useRef(false);

  const verify = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setIsAdmin(false);
      return;
    }
    if (checking.current) return;
    checking.current = true;
    try {
      // El rol se valida SIEMPRE en el servidor.
      const ok = await adminRpc<boolean>('is_super_admin');
      setIsAdmin(!!ok);
    } catch {
      setIsAdmin(false);
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => verify(s), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await verify(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [verify]);

  // Cierre de sesión por 30 minutos de inactividad
  useEffect(() => {
    if (!session) return;
    const touch = () => localStorage.setItem(IDLE_KEY, String(Date.now()));
    touch();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'visibilitychange'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      const last = Number(localStorage.getItem(IDLE_KEY) || 0);
      if (last && Date.now() - last > ADMIN_IDLE_MS) {
        localStorage.removeItem(IDLE_KEY);
        supabase.auth.signOut();
      }
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [session]);

  const value: AdminAuthState = {
    session,
    isAdmin,
    loading,
    email: session?.user?.email ?? null,
    signOut: async () => {
      localStorage.removeItem(IDLE_KEY);
      await supabase.auth.signOut();
    },
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
