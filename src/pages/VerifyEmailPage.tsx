import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MailCheck, LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import cupoLogo from '@/assets/cupo-logo.png';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { user, signOut, emailVerified } = useAuth();
  const [sending, setSending] = useState(false);

  if (emailVerified) {
    navigate('/welcome', { replace: true });
    return null;
  }

  const handleResend = async () => {
    if (!user?.email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: window.location.origin + '/welcome' },
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success('Email de verificación reenviado');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 text-center">
        <img src={cupoLogo} alt="Cupo" className="mx-auto h-12 w-auto mb-6" />
        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold font-display mb-2">Verificá tu email</h1>
        <p className="text-muted-foreground mb-6">
          Te enviamos un link a <strong>{user?.email}</strong>. Necesitás verificarlo para poder comprar entradas.
        </p>
        <div className="space-y-3">
          <Button onClick={handleResend} disabled={sending} className="w-full h-11 rounded-2xl brand-gradient-bg text-primary-foreground">
            <RefreshCw className={`h-4 w-4 mr-2 ${sending ? 'animate-spin' : ''}`} />
            Reenviar email
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full h-11 rounded-2xl">
            Ya verifiqué — recargar
          </Button>
          <Button onClick={async () => { await signOut(); navigate('/'); }} variant="ghost" className="w-full text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
