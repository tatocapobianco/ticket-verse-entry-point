import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart3,
  Banknote,
  Receipt,
  Building2,
  CalendarDays,
  Users,
  LifeBuoy,
  ScrollText,
  ShieldCheck,
  LogOut,
  Search,
  Menu,
} from 'lucide-react';

const nav = [
  { to: '/admin/metricas', label: 'Métricas y facturación', icon: BarChart3 },
  { to: '/admin/liquidaciones', label: 'Liquidaciones', icon: Banknote },
  { to: '/admin/transacciones', label: 'Transacciones', icon: Receipt },
  { to: '/admin/productoras', label: 'Productoras', icon: Building2 },
  { to: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/soporte', label: 'Resolución de problemas', icon: LifeBuoy },
  { to: '/admin/actividad', label: 'Registro de actividad', icon: ScrollText },
  { to: '/admin/administradores', label: 'Administradores', icon: ShieldCheck },
];

export default function AdminLayout() {
  const { email, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/admin/buscar?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold font-display hidden sm:inline">Cupo · Administración</span>
          </div>

          <form onSubmit={search} className="flex-1 max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por email, N° de operación o código de ticket…"
              className="pl-9 h-9 rounded-md"
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden md:block max-w-[180px] truncate">{email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`${open ? 'block' : 'hidden'} lg:block w-full lg:w-60 shrink-0 border-r border-border bg-card lg:min-h-[calc(100vh-3.5rem)]`}
        >
          <nav className="p-2 space-y-0.5">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/80 hover:bg-muted'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
