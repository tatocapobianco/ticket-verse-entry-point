import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ticket, UserCog, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { eventInitials } from '@/lib/format';

export function UserMenu() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      setFullName((data?.full_name as string) ?? '');
    })();
  }, [user?.id]);

  if (!user) return null;

  const email = user.email ?? '';
  const displayName = fullName || (user.user_metadata as any)?.full_name || email.split('@')[0] || 'Mi cuenta';
  const isOrganizer = roles.includes('organizer');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Mi cuenta">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="brand-gradient-bg text-primary-foreground text-sm font-semibold">
            {eventInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={8} collisionPadding={16} className="w-[260px] rounded-2xl">
        <DropdownMenuLabel className="py-3 px-3 w-full max-w-[260px]">
          <p className="font-display font-semibold text-sm truncate w-full" title={displayName}>{displayName}</p>
          <p className="text-xs text-muted-foreground font-normal truncate w-full" title={email}>{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/buyer-dashboard')} className="cursor-pointer">
          <Ticket className="h-4 w-4 mr-2" /> Mis Tickets
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/buyer-dashboard')} className="cursor-pointer">
          <UserCog className="h-4 w-4 mr-2" /> Mi Perfil
        </DropdownMenuItem>

        {isOrganizer && (
          <DropdownMenuItem onClick={() => navigate('/organizer-dashboard')} className="cursor-pointer">
            <Users className="h-4 w-4 mr-2" /> Panel de Organizador
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => { await signOut(); navigate('/'); }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
