
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const PurchasePage = () => {
  const { eventId, ticketId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [paymentStep, setPaymentStep] = useState('details'); // 'details', 'summary', 'success'

  // Mock data del evento y ticket
  const eventData = {
    id: 1,
    name: 'Concierto Rock Nacional',
    date: '2024-07-15',
    time: '21:00',
    location: 'Estadio Luna Park',
    ticket: {
      id: 1,
      type: 'General',
      price: 15000,
      available: 500,
      status: 'available' // 'available' o 'sold_out'
    }
  };

  const serviceCommission = 0.15; // 15% de comisión
  const ticketTotal = eventData.ticket.price * quantity;
  const commission = Math.round(ticketTotal * serviceCommission);
  const totalAmount = ticketTotal + commission;

  const handleBuyClick = () => {
    setPaymentStep('summary');
  };

  const handleFinalPurchase = () => {
    console.log('Procesando compra:', {
      eventId,
      ticketId,
      quantity,
      ticketTotal,
      commission,
      totalAmount
    });

    // Simulamos el proceso de pago con MercadoPago
    toast.info('Redirigiendo a MercadoPago...');
    
    setTimeout(() => {
      setPaymentStep('success');
      toast.success('¡Compra realizada exitosamente!');
    }, 2000);
  };

  const handleGoBack = () => {
    if (paymentStep === 'summary') {
      setPaymentStep('details');
    } else {
      navigate('/buyer-dashboard');
    }
  };

  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">¡Compra Exitosa!</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
              <div className="text-sm text-blue-800 font-medium mb-2">🔒 ¡Compra exitosa!</div>
              <div className="text-sm text-blue-700">
                Recibiste un email de confirmación con los detalles.<br/>
                Tu ticket con código QR está disponible solo dentro de la app, en la sección "Mis Tickets". 
                Recordá que el QR es único e intransferible.
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="text-sm text-gray-600">Código de compra:</div>
              <div className="font-mono font-bold">CMP{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            </div>
            <Button onClick={() => navigate('/buyer-dashboard')} className="w-full">
              Ver Mis Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStep === 'summary') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={handleGoBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Compra</CardTitle>
              <CardDescription>Revisa los detalles antes de finalizar tu compra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{eventData.name}</h3>
                  <p className="text-gray-600">{eventData.date} - {eventData.time}</p>
                  <p className="text-gray-600">{eventData.location}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Ticket: {eventData.ticket.type} ({quantity}x)</span>
                    <span className="font-medium">${ticketTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Cargo por servicio</span>
                    <span className="font-medium">${commission.toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total a pagar</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <Button onClick={handleFinalPurchase} className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Finalizar compra
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={handleGoBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Detalles del Evento */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{eventData.name}</h3>
                  <p className="text-gray-600">{eventData.date} - {eventData.time}</p>
                  <p className="text-gray-600">{eventData.location}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Tipo de Ticket</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{eventData.ticket.type}</span>
                      <span className="font-bold">${eventData.ticket.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Compra */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Compra</CardTitle>
              <CardDescription>Selecciona la cantidad y continúa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tickets ({quantity}x)</span>
                    <span>${ticketTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                {eventData.ticket.status === 'available' ? (
                  <Button onClick={handleBuyClick} className="w-full" size="lg">
                    Comprar
                  </Button>
                ) : (
                  <Button disabled className="w-full" size="lg" variant="secondary">
                    Agotado
                  </Button>
                )}
                
                <p className="text-xs text-gray-500 text-center">
                  Al continuar, aceptas nuestros términos y condiciones.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
