
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, XCircle, Clock, Camera, Search } from 'lucide-react';
import { toast } from 'sonner';

const ScannerDashboard = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanHistory, setScanHistory] = useState([
    {
      id: 1,
      qrCode: 'QR123456789',
      ticketType: 'General',
      eventName: 'Concierto Rock Nacional',
      timestamp: '2024-06-19 14:30:00',
      status: 'valid',
      attendeeName: 'Juan Pérez'
    },
    {
      id: 2,
      qrCode: 'QR987654321',
      ticketType: 'VIP',
      eventName: 'Festival de Jazz',
      timestamp: '2024-06-19 14:25:00',
      status: 'already_scanned',
      attendeeName: 'María García'
    }
  ]);

  // Mock function para validar QR
  const validateQR = (qrCode: string) => {
    console.log('Validando QR:', qrCode);
    
    // Simulamos diferentes tipos de respuesta
    const mockResponses = [
      {
        valid: true,
        status: 'valid',
        ticket: {
          id: 'TKT001',
          eventName: 'Concierto Rock Nacional',
          ticketType: 'General',
          attendeeName: 'Juan Pérez',
          eventDate: '2024-07-15',
          eventTime: '21:00'
        }
      },
      {
        valid: false,
        status: 'already_scanned',
        message: 'Este ticket ya fue escaneado anteriormente',
        scannedAt: '2024-06-19 13:45:00'
      },
      {
        valid: false,
        status: 'invalid_event',
        message: 'Este ticket no corresponde a este evento'
      },
      {
        valid: false,
        status: 'expired',
        message: 'Este ticket ha expirado'
      },
      {
        valid: false,
        status: 'invalid_qr',
        message: 'Código QR no válido'
      }
    ];

    // Seleccionamos una respuesta aleatoria para la demo
    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    setScanResult(response);

    // Agregamos al historial
    const newScan = {
      id: scanHistory.length + 1,
      qrCode: qrCode,
      ticketType: response.valid ? response.ticket?.ticketType : 'N/A',
      eventName: response.valid ? response.ticket?.eventName : 'N/A',
      timestamp: new Date().toLocaleString('es-AR'),
      status: response.status,
      attendeeName: response.valid ? response.ticket?.attendeeName : 'N/A'
    };

    setScanHistory(prev => [newScan, ...prev]);
    
    if (response.valid) {
      toast.success('¡Ticket válido!');
    } else {
      toast.error('Ticket inválido');
    }
  };

  const handleScanCamera = () => {
    // En una implementación real, aquí abriríamos la cámara
    toast.info('Funcionalidad de cámara en desarrollo');
    // Simulamos un escaneo
    const mockQR = 'QR' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setTimeout(() => validateQR(mockQR), 1000);
  };

  const handleManualScan = () => {
    if (manualCode.trim()) {
      validateQR(manualCode.trim());
      setManualCode('');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-500 text-white';
      case 'already_scanned':
        return 'bg-yellow-500 text-white';
      case 'invalid_event':
      case 'expired':
      case 'invalid_qr':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-6 w-6" />;
      case 'already_scanned':
        return <Clock className="h-6 w-6" />;
      default:
        return <XCircle className="h-6 w-6" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Ticket Válido - Acceso Permitido';
      case 'already_scanned':
        return 'Ticket Ya Escaneado';
      case 'invalid_event':
        return 'Ticket de Otro Evento';
      case 'expired':
        return 'Ticket Expirado';
      case 'invalid_qr':
        return 'Código QR Inválido';
      default:
        return 'Estado Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TicketPro</h1>
              <Badge variant="secondary" className="ml-3">Escaneador</Badge>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Escaneo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Escanear Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleScanCamera}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Escanear con Cámara
                </Button>
                
                <div className="text-center text-gray-500">o</div>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Código QR manual"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                  />
                  <Button onClick={handleManualScan} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultado del Escaneo */}
            {scanResult && (
              <Card className={`border-l-4 ${
                scanResult.valid ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardContent className="pt-6">
                  <div className={`rounded-lg p-4 ${getStatusColor(scanResult.status)}`}>
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      {getStatusIcon(scanResult.status)}
                      <span className="text-xl font-bold">
                        {getStatusMessage(scanResult.status)}
                      </span>
                    </div>
                    
                    {scanResult.valid && scanResult.ticket && (
                      <div className="text-center space-y-1 text-white">
                        <div className="text-lg font-semibold">{scanResult.ticket.attendeeName}</div>
                        <div>{scanResult.ticket.eventName}</div>
                        <div>{scanResult.ticket.ticketType}</div>
                        <div className="text-sm opacity-90">
                          {scanResult.ticket.eventDate} - {scanResult.ticket.eventTime}
                        </div>
                      </div>
                    )}
                    
                    {!scanResult.valid && (
                      <div className="text-center text-white">
                        <div className="text-sm">{scanResult.message}</div>
                        {scanResult.scannedAt && (
                          <div className="text-xs opacity-90 mt-1">
                            Escaneado: {scanResult.scannedAt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Historial de Escaneos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Historial de Escaneos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {scan.attendeeName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {scan.eventName} - {scan.ticketType}
                        </div>
                        <div className="text-xs text-gray-400">
                          {scan.timestamp}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <Badge 
                          variant={scan.status === 'valid' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {scan.status === 'valid' ? 'Válido' : 'Inválido'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerDashboard;
