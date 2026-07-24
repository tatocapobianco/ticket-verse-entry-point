import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode, Users, LogOut, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import cupoLogo from '@/assets/cupo-logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate('/', { replace: true });
        return;
      }
      const meta = (data.session.user.user_metadata ?? {}) as Record<string, any>;
      setUserName(meta.full_name || meta.name || data.session.user.email?.split('@')[0] || 'Usuario');
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleModeSelection = (mode: 'buyer' | 'organizer' | 'scanner') => {
    localStorage.setItem('currentMode', mode);
    if (mode === 'buyer') navigate('/buyer-dashboard');
    else if (mode === 'organizer') navigate('/organizer-dashboard');
    else navigate('/scanner-access');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  const modes = [
    {
      key: 'buyer' as const,
      title: 'Mis Eventos',
      subtitle: 'Descubrí y comprá entradas',
      icon: Calendar,
      accentClass: 'from-primary to-primary-glow',
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      key: 'organizer' as const,
      title: 'Modo Organizador',
      subtitle: 'Creá y gestioná tus eventos',
      icon: Users,
      accentClass: 'from-accent to-primary',
      iconBg: 'bg-accent/10 text-accent',
    },
    {
      key: 'scanner' as const,
      title: 'Modo Escaneador',
      subtitle: 'Validá entradas en la puerta',
      icon: QrCode,
      accentClass: 'from-primary to-accent',
      iconBg: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <img src={cupoLogo} alt="Cupo" className="h-10 w-auto" />
          <Button variant="ghost" onClick={handleLogout} className="rounded-full text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </header>

        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            ¡Qué bueno verte!
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold font-display">
            Hola, <span className="brand-gradient-text">{userName}</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mt-2">
            ¿Cómo querés usar Cupo hoy?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {modes.map(({ key, title, subtitle, icon: Icon, iconBg }) => (
            <button
              key={key}
              onClick={() => handleModeSelection(key)}
              className="group text-left glass-card rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`h-14 w-14 rounded-2xl ${iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold font-display">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                Entrar
                <ArrowRight className="h-4 w-4" />
              </div>
              {key === 'scanner' && (
                <p className="text-xs text-muted-foreground mt-3">
                  Requiere autorización del evento
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
