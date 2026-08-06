import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { eventInitials } from '@/lib/format';
import {
  EVENT_IMAGE_HELP,
  cropEventImage,
  validateEventImage,
} from '@/lib/eventImage';

type Props = {
  /** URL actual (ya guardada) o preview local. */
  value: string | null;
  /** Se llama con el preview y el blob recortado listo para subir, o null al borrar. */
  onChange: (next: { previewUrl: string; blob: Blob } | null) => void;
  eventName?: string;
  label?: string;
};

/**
 * Campo de imagen (flyer) del evento: subir, reemplazar o borrar, con recorte
 * automático al centro en 1200 × 628 y preview de cómo queda la tarjeta.
 */
export function EventImageField({ value, onChange, eventName = '', label = 'Imagen del evento (flyer)' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const pick = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    const invalid = validateEventImage(file);
    if (invalid) { setError(invalid); return; }
    setProcessing(true);
    try {
      const { blob, previewUrl } = await cropEventImage(file);
      onChange({ blob, previewUrl });
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Preview: así se va a ver la tarjeta */}
      <div className="rounded-2xl overflow-hidden border border-border bg-secondary/30">
        <div className="relative aspect-[1200/628]">
          {value ? (
            <img src={value} alt={`Flyer de ${eventName || 'el evento'}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 brand-hero-gradient flex items-center justify-center">
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
          Preview de la tarjeta {value ? '' : '— sin imagen se usa el gradiente con las iniciales'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4 mr-2" /> {value ? 'Reemplazar imagen' : 'Subir imagen'}
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
        <p className="text-xs text-muted-foreground">{EVENT_IMAGE_HELP}</p>
      )}
    </div>
  );
}
