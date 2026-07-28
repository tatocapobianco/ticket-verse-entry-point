import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, XCircle, Clock, Camera, Search, LogOut, CameraOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import cupoLogo from '@/assets/cupo-logo.png';

type ScanResult = { result: string; ticket_id: string | null; attendee: string | null; ticket_type_name: string | null; event_name: string | null };
type HistoryEntry = ScanResult & { qr: string; at: string };

const messages: Record<string, string> = {
  valid: 'Ticket válido - Acceso permitido',
  already_used: 'Ticket ya usado',
  wrong_event: 'Ticket de otro evento',
  invalid_qr: 'Código QR inválido',
  invalid: 'Ticket inválido',
  invalid_access_key: 'Clave de acceso inválida',
  invalid_event: 'Evento no encontrado',
};

const ScannerDashboard = () => {
  const navigate = useNavigate();
  const [eventNumber, setEventNumber] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [eventName, setEventName] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ code: string; ts: number }>({ code: '', ts: 0 });

  useEffect(() => {
    const en = sessionStorage.getItem('scanner_event_number');
    const ak = sessionStorage.getItem('scanner_access_key');
    if (!en || !ak) { navigate('/scanner-access'); return; }
    setEventNumber(en); setAccessKey(ak);
    setEventName(sessionStorage.getItem('scanner_event_name') || '');
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, [navigate]);

  const doScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    // Dedup rapid re-scans of same QR
    if (lastScanRef.current.code === trimmed && Date.now() - lastScanRef.current.ts < 3000) return;
    lastScanRef.current = { code: trimmed, ts: Date.now() };

    const { data, error } = await supabase.rpc('validate_and_scan_ticket', {
      _qr_code: trimmed, _event_number: eventNumber, _access_key: accessKey,
    });
    if (error) { toast.error(error.message); return; }
    const row: ScanResult = Array.isArray(data) ? data[0] : (data as any);
    setScanResult(row);
    setHistory(prev => [{ ...row, qr: trimmed, at: new Date().toLocaleTimeString('es-AR') }, ...prev].slice(0, 50));
    if (row.result === 'valid') toast.success('Válido'); else toast.error(messages[row.result] || 'Inválido');
  };

  const startCamera = async () => {
    try {
      const q = new Html5Qrcode('qr-reader');
      scannerRef.current = q;
      await q.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 },
        (decoded) => doScan(decoded), () => {});
      setCameraOn(true);
    } catch (e: any) {
      toast.error('No se pudo iniciar la cámara');
      console.error(e);
    }
  };
  const stopCamera = async () => {
    await scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setCameraOn(false);
  };

  const handleManual = () => { if (manualCode.trim()) { doScan(manualCode.trim()); setManualCode(''); } };
  const handleLogout = () => {
    stopCamera();
    sessionStorage.removeItem('scanner_event_number');
    sessionStorage.removeItem('scanner_access_key');
    sessionStorage.removeItem('scanner_event_name');
    navigate('/welcome');
  };

  const statusColor = (s: string) => s === 'valid' ? 'bg-green-500 text-white'
    : s === 'already_used' ? 'bg-yellow-500 text-white' : 'bg-destructive text-destructive-foreground';
  const statusIcon = (s: string) => s === 'valid' ? <CheckCircle className="h-6 w-6" />
    : s === 'already_used' ? <Clock className="h-6 w-6" /> : <XCircle className="h-6 w-6" />;

  return (
    <div className="min-h-screen gradient-bg">
      <header className="bg-white/70 backdrop-blur-md border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img src={cupoLogo} alt="Cupo" className="h-8 w-auto" />
            <Badge variant="secondary" className="rounded-full">Escaneador</Badge>
            {eventName && <span className="text-sm text-muted-foreground hidden sm:inline">{eventName}</span>}
          </div>
          <Button variant="ghost" onClick={handleLogout} className="rounded-full">
            <LogOut className="h-4 w-4 mr-2" /> Salir
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="rounded-3xl soft-shadow">
            <CardHeader><CardTitle className="flex items-center font-display"><QrCode className="h-5 w-5 mr-2 text-primary" />Escanear ticket</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div id="qr-reader" className={cameraOn ? 'rounded-2xl overflow-hidden' : 'hidden'} />
              {!cameraOn ? (
                <Button onClick={startCamera} className="w-full h-12 rounded-2xl brand-gradient-bg text-primary-foreground">
                  <Camera className="h-5 w-5 mr-2" /> Escanear con cámara
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="w-full h-12 rounded-2xl">
                  <CameraOff className="h-5 w-5 mr-2" /> Detener cámara
                </Button>
              )}
              <div className="text-center text-xs uppercase tracking-wider text-muted-foreground">o</div>
              <div className="flex space-x-2">
                <Input placeholder="Código QR manual" value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManual()}
                  className="h-11 rounded-2xl" />
                <Button onClick={handleManual} variant="outline" className="rounded-2xl h-11">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {scanResult && (
            <Card className={`rounded-3xl border-l-4 soft-shadow ${scanResult.result === 'valid' ? 'border-l-green-500' : 'border-l-destructive'}`}>
              <CardContent className="pt-6">
                <div className={`rounded-2xl p-4 ${statusColor(scanResult.result)}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {statusIcon(scanResult.result)}
                    <span className="text-xl font-bold">{messages[scanResult.result] || 'Inválido'}</span>
                  </div>
                  {scanResult.result === 'valid' && (
                    <div className="text-center">
                      <div className="font-semibold">{scanResult.attendee}</div>
                      <div className="text-sm opacity-90">{scanResult.ticket_type_name}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="rounded-3xl soft-shadow">
          <CardHeader><CardTitle className="font-display">Historial del turno</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin escaneos aún</p>}
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/40 rounded-2xl">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{h.attendee || h.qr.slice(0, 12)}</div>
                    <div className="text-xs text-muted-foreground">{h.ticket_type_name || '—'} · {h.at}</div>
                  </div>
                  <Badge variant={h.result === 'valid' ? 'default' : 'destructive'} className="text-xs">
                    {h.result === 'valid' ? 'Válido' : 'Inválido'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScannerDashboard;
