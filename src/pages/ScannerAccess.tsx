import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import cupoLogo from '@/assets/cupo-logo.png';

const ScannerAccess = () => {
  const navigate = useNavigate();
  const [eventNumber, setEventNumber] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccess = async () => {
    if (!eventNumber || !accessKey) { toast.error('Completá todos los campos'); return; }
    setLoading(true);
    // Verify by attempting a dry-run scan with a dummy QR — returns 'invalid_qr' if event+key match.
    const { data, error } = await supabase.rpc('validate_and_scan_ticket', {
      _qr_code: '__probe__', _event_number: eventNumber, _access_key: accessKey,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const row = Array.isArray(data) ? data[0] : (data as any);
    if (row?.result === 'invalid_event') { toast.error('Evento no encontrado'); return; }
    if (row?.result === 'invalid_access_key') { toast.error('Clave incorrecta'); return; }
    sessionStorage.setItem('scanner_event_number', eventNumber);
    sessionStorage.setItem('scanner_access_key', accessKey);
    sessionStorage.setItem('scanner_event_name', row?.event_name ?? '');
    toast.success('Acceso autorizado');
    navigate('/scanner-dashboard');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl" />
      <div className="w-full max-w-md relative z-10">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div className="text-center mb-6">
          <img src={cupoLogo} alt="Cupo" className="mx-auto h-12 w-auto mb-4" />
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display">Modo Escaneador</h1>
          <p className="text-muted-foreground text-sm mt-1">Ingresá los datos del evento para acceder</p>
        </div>
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="eventNumber">Número de evento</Label>
            <Input id="eventNumber" placeholder="Ej: EVT-ABC123" value={eventNumber}
              onChange={(e) => setEventNumber(e.target.value.toUpperCase())} className="h-12 rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessKey">Clave de acceso</Label>
            <Input id="accessKey" type="password" placeholder="••••••••" value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)} className="h-12 rounded-2xl" />
          </div>
          <Button onClick={handleAccess} disabled={loading}
            className="w-full h-12 rounded-2xl brand-gradient-bg text-primary-foreground font-semibold">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Acceder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScannerAccess;
