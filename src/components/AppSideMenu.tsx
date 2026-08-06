import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogIn, Ticket, Users, QrCode, LogOut, UserCog } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProductora } from '@/hooks/useProductora';

export function AppSideMenu() {
  const { user, roles, signOut } = useAuth();
  const { productora } = useProductora();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isScanner = roles.includes('scanner');

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const logout = async () => {
    await signOut();
    setOpen(false);
    navigate('/');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="font-display">Menú</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-1">
          {!user ? (
            <Button onClick={() => go('/login')} className="justify-start rounded-2xl brand-gradient-bg text-primary-foreground">
              <LogIn className="h-4 w-4 mr-2" /> Iniciar sesión
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => go('/buyer-dashboard')} className="justify-start rounded-2xl">
                <Ticket className="h-4 w-4 mr-2" /> Mis entradas
              </Button>

              <Button variant="ghost" onClick={() => go('/organizer')} className="justify-start rounded-2xl">
                <Users className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">
                  {productora ? `Panel de ${productora.nombre}` : 'Panel de Organizador'}
                </span>
              </Button>

              {isScanner && (
                <Button variant="ghost" onClick={() => go('/scanner-access')} className="justify-start rounded-2xl">
                  <QrCode className="h-4 w-4 mr-2" /> Escáner
                </Button>
              )}

              <Button variant="ghost" onClick={() => go('/scanner-access')} className="justify-start rounded-2xl">
                <QrCode className="h-4 w-4 mr-2" /> Modo escáner
              </Button>

              <div className="h-px bg-border my-3" />

              <Button variant="ghost" onClick={() => go('/buyer-dashboard')} className="justify-start rounded-2xl">
                <UserCog className="h-4 w-4 mr-2" /> Mi perfil
              </Button>
              <Button variant="ghost" onClick={logout} className="justify-start rounded-2xl text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
