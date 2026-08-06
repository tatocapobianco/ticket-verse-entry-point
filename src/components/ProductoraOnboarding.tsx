import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import cupoLogo from '@/assets/cupo-logo.png';
import { ProductoraForm } from '@/components/ProductoraForm';
import type { Productora } from '@/hooks/useProductora';

export function ProductoraOnboarding({ onCreated }: { onCreated: (p: Productora) => void }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="brand-gradient-bg">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-14">
          <Link to="/" className="inline-block">
            <img src={cupoLogo} alt="Cupo" className="h-8 w-auto brightness-0 invert" />
          </Link>
          <p className="mt-8 inline-flex items-center gap-1.5 text-sm text-primary-foreground/80">
            <Sparkles className="h-4 w-4" /> Modo productor
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary-foreground mt-2">
            Creá tu productora
          </h1>
          <p className="text-primary-foreground/85 mt-2 text-base sm:text-lg">
            Publicá tus eventos y vendé entradas en minutos
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 -mt-8 pb-16">
        <Card className="rounded-3xl soft-shadow border-border bg-card">
          <CardContent className="p-6 sm:p-8">
            <ProductoraForm onSaved={onCreated} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
