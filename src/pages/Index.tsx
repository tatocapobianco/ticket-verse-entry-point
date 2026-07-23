import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, IdCard, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import cupoLogo from '@/assets/cupo-logo.png';

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = safeNext(searchParams.get('next'));
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    dni: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate(nextPath ?? '/welcome', { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(nextPath ?? '/welcome', { replace: true });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast.error('Completá tu email y contraseña');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email.trim(),
      password: loginData.password,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('¡Hola de nuevo! 👋');
    navigate(nextPath ?? '/welcome', { replace: true });
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast.error('Completá nombre, email y contraseña');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    const emailRedirectTo = window.location.origin + (nextPath ?? '/welcome');
    const { error } = await supabase.auth.signUp({
      email: registerData.email.trim(),
      password: registerData.password,
      options: {
        emailRedirectTo,
        data: { full_name: registerData.name, dni: registerData.dni },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('¡Cuenta creada! Revisá tu email si se pide confirmación.');
    navigate(nextPath ?? '/welcome', { replace: true });
  };

  const handleGoogleAuth = async () => {
    const redirectPath = nextPath ? `/?next=${encodeURIComponent(nextPath)}` : '/';
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + redirectPath,
    });
    if (result.error) {
      toast.error(result.error.message ?? 'No se pudo iniciar sesión con Google');
      return;
    }
    if (result.redirected) return;
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.5-4.8 9.5-8.7 0-.6-.1-1-.1-1.5H12z"/>
    </svg>
  );

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <img
            src={cupoLogo}
            alt="Cupo"
            className="mx-auto h-16 w-auto mb-4 drop-shadow-sm"
          />
          <p className="text-muted-foreground text-base flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            Descubrí, comprá y viví eventos
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-display">Bienvenido/a</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresá o creá tu cuenta en segundos
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/70 rounded-full p-1 h-11">
              <TabsTrigger
                value="login"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
              >
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
              >
                Registrarse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6 space-y-4">
              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full h-12 rounded-2xl border-border bg-white hover:bg-secondary/50 font-medium soft-shadow"
              >
                <GoogleIcon />
                <span className="ml-2">Continuar con Google</span>
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-white px-3 text-muted-foreground">o con email</span>
                </div>
              </div>

              <FieldWithIcon icon={<Mail className="h-4 w-4" />} label="Email o DNI" id="email">
                <Input
                  id="email"
                  type="text"
                  placeholder="tu@email.com o 12345678"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="h-12 rounded-2xl pl-10 bg-secondary/40 border-border"
                />
              </FieldWithIcon>

              <FieldWithIcon icon={<Lock className="h-4 w-4" />} label="Contraseña" id="password">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="h-12 rounded-2xl pl-10 bg-secondary/40 border-border"
                />
              </FieldWithIcon>

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-12 rounded-2xl brand-gradient-bg text-primary-foreground font-semibold startup-shadow hover:opacity-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="mt-6 space-y-4">
              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full h-12 rounded-2xl border-border bg-white hover:bg-secondary/50 font-medium soft-shadow"
              >
                <GoogleIcon />
                <span className="ml-2">Registrarse con Google</span>
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-white px-3 text-muted-foreground">o con email</span>
                </div>
              </div>

              <FieldWithIcon icon={<User className="h-4 w-4" />} label="Nombre completo" id="name">
                <Input
                  id="name" type="text" placeholder="Juan Pérez"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="h-12 rounded-2xl pl-10 bg-secondary/40 border-border"
                />
              </FieldWithIcon>

              <FieldWithIcon icon={<Mail className="h-4 w-4" />} label="Email" id="regEmail">
                <Input
                  id="regEmail" type="email" placeholder="tu@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="h-12 rounded-2xl pl-10 bg-secondary/40 border-border"
                />
              </FieldWithIcon>

              <FieldWithIcon icon={<IdCard className="h-4 w-4" />} label="DNI (opcional)" id="dni">
                <Input
                  id="dni" type="text" placeholder="12345678"
                  value={registerData.dni}
                  onChange={(e) => setRegisterData({ ...registerData, dni: e.target.value })}
                  className="h-12 rounded-2xl pl-10 bg-secondary/40 border-border"
                />
              </FieldWithIcon>

              <div className="grid grid-cols-1 gap-4">
                <FieldWithIcon icon={<Lock className="h-4 w-4" />} label="Contraseña" id="registerPassword">
                  <Input
                    id="registerPassword" type="password" placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="h-12 rounded-2xl pl-10 bg-secondary/40 border-border"
                  />
                </FieldWithIcon>
                <FieldWithIcon icon={<Lock className="h-4 w-4" />} label="Repetir contraseña" id="confirmPassword">
                  <Input
                    id="confirmPassword" type="password" placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="h-12 rounded-2xl pl-10 bg-secondary/40 border-border"
                  />
                </FieldWithIcon>
              </div>

              <Button
                onClick={handleRegister}
                disabled={loading}
                className="w-full h-12 rounded-2xl brand-gradient-bg text-primary-foreground font-semibold startup-shadow hover:opacity-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear cuenta'}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Al continuar aceptás nuestros <span className="underline">Términos</span> y{' '}
          <span className="underline">Política de Privacidad</span>.
        </p>
      </div>
    </div>
  );
};

function FieldWithIcon({
  icon, label, id, children,
}: { icon: React.ReactNode; label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}

export default Index;
