import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { adminRpc } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(
          signInError.message.toLowerCase().includes('invalid')
            ? 'Usuario o contraseña incorrectos.'
            : 'No pudimos iniciar sesión. Probá de nuevo en unos minutos.',
        );
        return;
      }
      // El rol se verifica en el servidor.
      const ok = await adminRpc<boolean>('is_super_admin').catch(() => false);
      if (!ok) {
        await supabase.auth.signOut();
        setError('Usuario o contraseña incorrectos.');
      }
    } catch {
      setError('No pudimos iniciar sesión. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-11 w-11 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold font-display">Cupo · Administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Acceso restringido al equipo de la plataforma.</p>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Usuario</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Contraseña</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ingresar
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            La sesión se cierra automáticamente después de 30 minutos de inactividad.
          </p>
        </form>
      </div>
    </div>
  );
}
