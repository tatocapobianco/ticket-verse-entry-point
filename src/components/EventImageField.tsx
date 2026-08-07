import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { eventInitials } from '@/lib/format';
import {
  FLYER_HELP,
  THUMB_HELP,
  cropEventImage,
  resizeFlyerImage,
  validateEventImage,
} from '@/lib/eventImage';

type Props = {
  /** URL actual (ya guardada) o preview local. */
  value: string | null;
  /** Se llama con el preview y el blob procesado listo para subir, o null al borrar. */
  onChange: (next: { previewUrl: string; blob: Blob } | null) => void;
  /** 'thumb' = miniatura horizontal recortada · 'flyer' = imagen completa sin recortar. */
  variant?: 'thumb' | 'flyer';
  eventName?: string;
  label?: string;
};

/**
 * Campo de imagen del evento. La miniatura se recorta al centro en 1200 × 628
 * (así se ve la tarjeta del listado) y el flyer se mantiene completo, sin recortar.
 */
export function EventImageField({ value, onChange, variant = 'thumb', eventName = '', label }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const isFlyer = variant === 'flyer';
  const help = isFlyer ? FLYER_HELP : THUMB_HELP;
  const fieldLabel = label ?? (isFlyer ? 'Flyer del evento' : 'Miniatura (portada de la tarjeta)');

  const pick = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    const invalid = validateEventImage(file);
    if (invalid) { setError(invalid); return; }
    setProcessing(true);
    try {
      const { blob, previewUrl } = isFlyer ? await resizeFlyerImage(file) : await cropEventImage(file);
      onChange({ blob, previewUrl });
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{fieldLabel}</Label>

      {/* Preview: así se va a ver en la app */}
      <div className="rounded-2xl overflow-hidden border border-border bg-secondary/30">
        <div className={isFlyer ? 'relative flex justify-center bg-secondary/40 p-3' : 'relative aspect-[1200/628]'}>
          {value ? (
            isFlyer ? (
              <img
                src={value}
                alt={`Flyer de ${eventName || 'el evento'}`}
                className="max-h-72 w-auto max-w-full rounded-xl object-contain"
              />
            ) : (
              <img
                src={value}
                alt={`Miniatura de ${eventName || 'el evento'}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )
          ) : (
            <div className={`${isFlyer ? 'h-56 w-full rounded-xl' : 'absolute inset-0'} brand-hero-gradient flex items-center justify-center`}>
              <span className="font-display font-bold text-4xl text-primary-foreground/90">
                {eventInitials(eventName || 'Evento')}
              </span>
            </div>
          )}
          {processing && (
            <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
            </div>
          )}
        </div>
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {isFlyer
            ? `Preview de la página del evento${value ? '' : ' — sin flyer se usa el gradiente con las iniciales'}`
            : `Preview de la tarjeta del listado${value ? '' : ' — si no la subís, se genera del flyer'}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4 mr-2" />
          {value ? 'Reemplazar imagen' : isFlyer ? 'Subir flyer' : 'Subir miniatura'}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-destructive"
            onClick={() => { setError(null); onChange(null); }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Borrar imagen
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { pick(e.target.files?.[0]); e.currentTarget.value = ''; }}
        />
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{help}</p>
      )}
    </div>
  );
}
