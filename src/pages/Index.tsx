import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, IdCard, Sparkles, Cake, AlertCircle, MailCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import cupoLogo from '@/assets/cupo-logo.png';

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

/** Traduce los errores de autenticación a mensajes claros en español. */
function authErrorMessage(error: any): string {
  const raw = (error?.message ?? '').toLowerCase();
  const code = (error?.code ?? '').toLowerCase();

  if (code === 'user_already_exists' || raw.includes('already registered') || raw.includes('user already')) {
    return 'Este email ya está registrado. Probá iniciar sesión o recuperar tu contraseña.';
  }
  if (raw.includes('known to be weak') || code === 'weak_password') {
    return 'Esa contraseña es demasiado común o insegura. Usá al menos 8 caracteres combinando letras, números y símbolos.';
  }
  if (raw.includes('password should be at least') || raw.includes('at least 6 characters')) {
    return 'La contraseña es muy corta: usá al menos 6 caracteres.';
  }
  if (code === 'invalid_credentials' || raw.includes('invalid login credentials')) {
    return 'Email/DNI o contraseña incorrectos. Revisá los datos e intentá de nuevo.';
  }
  if (raw.includes('email not confirmed') || code === 'email_not_confirmed') {
    return 'Tu email todavía no está confirmado. Abrí el link que te enviamos para activar tu cuenta.';
  }
  if (raw.includes('invalid email') || raw.includes('unable to validate email')) {
    return 'El email no parece válido. Revisá que esté bien escrito.';
  }
  if (code === 'over_email_send_rate_limit' || raw.includes('rate limit') || raw.includes('too many requests')) {
    return 'Hiciste demasiados intentos seguidos. Esperá unos minutos y volvé a probar.';
  }
  if (raw.includes('signups not allowed') || code === 'signup_disabled') {
    return 'Por el momento los registros están deshabilitados.';
  }
  if (raw.includes('failed to fetch') || raw.includes('network')) {
    return 'No pudimos conectarnos. Revisá tu conexión a internet e intentá otra vez.';
  }
  return error?.message || 'Ocurrió un error inesperado. Intentá de nuevo.';
}


const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = safeNext(searchParams.get('next'));
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    dni: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate(nextPath ?? '/', { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(nextPath ?? '/', { replace: true });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fail = (setter: (v: string | null) => void, message: string) => {
    setter(message);
    toast.error(message, { duration: 8000 });
  };

  const handleLogin = async () => {
    setLoginError(null);
    if (!loginData.email || !loginData.password) {
      return fail(setLoginError, 'Completá tu email o DNI y tu contraseña.');
    }
    setLoading(true);
    const identifier = loginData.email.trim();

    // DNI login is resolved server-side (the email is never exposed to the browser)
    if (/^\d{6,12}$/.test(identifier)) {
      const { data, error } = await supabase.functions.invoke('dni-login', {
        body: { dni: identifier, password: loginData.password },
      });
      let errorCode: string | null = (data as any)?.error ?? null;
      if (error) {
        try {
          errorCode = (await (error as any).context?.json())?.error ?? 'invalid_credentials';
        } catch {
          errorCode = 'invalid_credentials';
        }
      }
      if (errorCode || !(data as any)?.access_token) {
        setLoading(false);
        if (errorCode === 'email_not_confirmed') {
          return fail(
            setLoginError,
            'Tu email todavía no está confirmado. Abrí el link que te enviamos para activar tu cuenta.',
          );
        }
        return fail(setLoginError, 'DNI o contraseña incorrectos. Revisá los datos e intentá de nuevo.');
      }
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: (data as any).access_token,
        refresh_token: (data as any).refresh_token,
      });
      setLoading(false);
      if (sessionErr) return fail(setLoginError, authErrorMessage(sessionErr));
      toast.success('¡Hola de nuevo! 👋');
      navigate(nextPath ?? '/', { replace: true });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: loginData.password,
    });
    setLoading(false);
    if (error) {
      const message = authErrorMessage(error);
      fail(setLoginError, message);
      const raw = (error.message ?? '').toLowerCase();
      if (raw.includes('email not confirmed') || error.code === 'email_not_confirmed') {
        setConfirmSentTo(identifier);
      }
      return;
    }

    toast.success('¡Hola de nuevo! 👋');
    navigate(nextPath ?? '/', { replace: true });
  };

  const handleRegister = async () => {
    setRegisterError(null);
    if (!registerData.name || !registerData.email || !registerData.password) {
      return fail(setRegisterError, 'Completá nombre, email y contraseña.');
    }
    if (registerData.password !== registerData.confirmPassword) {
      return fail(setRegisterError, 'Las contraseñas no coinciden.');
    }
    if (registerData.password.length < 8) {
      return fail(setRegisterError, 'La contraseña debe tener al menos 8 caracteres.');
    }
    setLoading(true);
    const email = registerData.email.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: registerData.password,
      options: {
        data: {
          full_name: registerData.name,
          dni: registerData.dni,
          birth_date: registerData.birthDate || null,
        },
      },
    });
    if (error) {
      setLoading(false);
      return fail(setRegisterError, authErrorMessage(error));
    }

    // Auto-confirm está activo: si no vino sesión, iniciamos sesión al instante.
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: registerData.password,
      });
      if (signInErr) {
        setLoading(false);
        return fail(setRegisterError, authErrorMessage(signInErr));
      }
    }
    setLoading(false);
    toast.success('¡Bienvenido/a a Cupo!');
    navigate(nextPath ?? '/', { replace: true });
  };



  const handleGoogleAuth = async () => {
    const redirectPath = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/';
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
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );

  if (confirmSentTo) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card rounded-3xl p-8 text-center">
          <img src={cupoLogo} alt="Cupo" className="mx-auto h-12 w-auto mb-6" />
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <MailCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-2">Revisá tu email</h1>
          <p className="text-muted-foreground mb-6">
            Te enviamos un email de confirmación a <strong>{confirmSentTo}</strong>. Abrí el link para
            activar tu cuenta y poder ingresar.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={loading}
              className="w-full h-12 rounded-2xl brand-gradient-bg text-primary-foreground font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reenviar email'}
            </Button>
            <Button
              onClick={() => setConfirmSentTo(null)}
              variant="outline"
              className="w-full h-12 rounded-2xl"
            >
              Volver a iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              {loginError && (
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

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
                  autoComplete="username"
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
              {registerError && (
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}

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

              <FieldWithIcon icon={<Cake className="h-4 w-4" />} label="Fecha de nacimiento" id="birthDate">
                <Input
                  id="birthDate"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={registerData.birthDate}
                  onChange={(e) => setRegisterData({ ...registerData, birthDate: e.target.value })}
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
