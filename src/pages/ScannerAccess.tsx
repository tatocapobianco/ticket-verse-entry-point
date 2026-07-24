import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, QrCode, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import cupoLogo from '@/assets/cupo-logo.png';

const ScannerAccess = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ eventNumber: '', accessKey: '' });

  const handleAccess = () => {
    if (!formData.eventNumber || !formData.accessKey) {
      toast.error('Completá todos los campos');
      return;
    }
    localStorage.setItem('authorizedEventNumber', formData.eventNumber);
    localStorage.setItem('authorizedEventKey', formData.accessKey);
    toast.success('Acceso autorizado al evento');
    navigate('/scanner-dashboard');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-accent/15 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <Button variant="ghost" onClick={() => navigate('/welcome')} className="mb-4 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
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
            <Label htmlFor="eventNumber" className="text-sm font-medium">Número de Evento</Label>
            <Input
              id="eventNumber"
              placeholder="Ej: EVT001"
              value={formData.eventNumber}
              onChange={(e) => setFormData({ ...formData, eventNumber: e.target.value.toUpperCase() })}
              className="h-12 rounded-2xl bg-secondary/40 border-border"
            />
            <p className="text-xs text-muted-foreground">Proporcionado por el organizador</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessKey" className="text-sm font-medium">Clave de Acceso</Label>
            <Input
              id="accessKey"
              type="password"
              placeholder="••••••••"
              value={formData.accessKey}
              onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
              className="h-12 rounded-2xl bg-secondary/40 border-border"
            />
            <p className="text-xs text-muted-foreground">Clave secreta del evento</p>
          </div>

          <Button
            onClick={handleAccess}
            className="w-full h-12 rounded-2xl brand-gradient-bg text-primary-foreground font-semibold startup-shadow hover:opacity-95"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Acceder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScannerAccess;
