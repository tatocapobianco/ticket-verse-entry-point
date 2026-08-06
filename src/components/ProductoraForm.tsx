import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ImagePlus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fileToSquareDataUrl } from '@/lib/image';
import { slugify, type Productora } from '@/hooks/useProductora';
import { eventInitials } from '@/lib/format';

type Props = {
  productora?: Productora | null;
  onSaved: (p: Productora) => void;
  submitLabel?: string;
  showContactEmail?: boolean;
};

const MAX_DESC = 200;

export function ProductoraForm({ productora, onSaved, submitLabel, showContactEmail }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(productora?.nombre ?? '');
  const [logoUrl, setLogoUrl] = useState<string | null>(productora?.logo_url ?? null);
  const [descripcion, setDescripcion] = useState(productora?.descripcion ?? '');
  const [instagram, setInstagram] = useState((productora?.instagram ?? '').replace(/^@/, ''));
  const [telefono, setTelefono] = useState(productora?.telefono_contacto ?? '');
  const [emailContacto, setEmailContacto] = useState(productora?.email_contacto ?? '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const pickLogo = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Elegí un archivo de imagen');
    try {
      setLogoUrl(await fileToSquareDataUrl(file));
    } catch {
      toast.error('No se pudo procesar la imagen');
    }
  };

  const handleSubmit = async () => {
    const nombreLimpio = nombre.trim();
    setNameError(null);
    if (nombreLimpio.length < 3) {
      setNameError('El nombre tiene que tener al menos 3 caracteres');
      return;
    }
    if (!user) return;
    setSaving(true);

    const payload = {
      nombre: nombreLimpio,
      logo_url: logoUrl,
      descripcion: descripcion.trim() ? descripcion.trim().slice(0, MAX_DESC) : null,
      instagram: instagram.trim() ? `@${instagram.trim().replace(/^@/, '')}` : null,
      telefono_contacto: telefono.trim() || null,
      email_contacto: (showContactEmail ? emailContacto.trim() : '') || null,
    };

    if (productora) {
      const { error } = await supabase.from('productoras').update(payload).eq('id', productora.id);
      setSaving(false);
      if (error) {
        if (error.message.includes('productoras_nombre_key')) {
          setNameError('Ya existe una productora con ese nombre. Probá con otro.');
          return;
        }
        toast.error(error.message);
        return;
      }
      toast.success('Datos de la productora actualizados');
      onSaved({ ...productora, ...payload });
      return;
    }

    const { data: disponible } = await supabase.rpc('productora_nombre_disponible', { _nombre: nombreLimpio });
    if (disponible === false) {
      setSaving(false);
      setNameError('Ya existe una productora con ese nombre. Probá con otro.');
      return;
    }

    let slug = slugify(nombreLimpio);
    let inserted: any = null;
    for (let intento = 0; intento < 3 && !inserted; intento++) {
      const { data, error } = await supabase
        .from('productoras')
        .insert({ ...payload, slug, user_id: user.id })
        .select('id,nombre,slug,logo_url,descripcion,instagram,telefono_contacto,email_contacto')
        .maybeSingle();
      if (!error) { inserted = data; break; }
      if (error.message.includes('productoras_nombre_key')) {
        setSaving(false);
        setNameError('Ya existe una productora con ese nombre. Probá con otro.');
        return;
      }
      if (error.message.includes('productoras_slug_key')) {
        slug = `${slugify(nombreLimpio)}-${Math.random().toString(36).slice(2, 6)}`;
        continue;
      }
      setSaving(false);
      toast.error(error.message);
      return;
    }
    setSaving(false);
    if (!inserted) { toast.error('No se pudo crear la productora'); return; }
    toast.success('¡Tu productora ya está creada!');
    onSaved(inserted as Productora);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre de la productora *</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setNameError(null); }}
          placeholder="Ej. Producciones El Faro"
          className="h-12 rounded-2xl"
        />
        {nameError ? (
          <p className="text-xs text-destructive">{nameError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Así te van a ver los asistentes en tus eventos</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Logo (opcional)</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border border-border">
            {logoUrl && <AvatarImage src={logoUrl} alt="Logo de la productora" className="object-cover" />}
            <AvatarFallback className="brand-gradient-bg text-primary-foreground font-display font-semibold">
              {nombre.trim() ? eventInitials(nombre) : <Building2 className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4 mr-2" /> {logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl(null)} className="text-xs text-muted-foreground hover:text-destructive text-left">
                Quitar logo
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { pickLogo(e.target.files?.[0]); e.currentTarget.value = ''; }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción corta (opcional)</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          maxLength={MAX_DESC}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Contá en pocas palabras qué eventos hacés"
          className="rounded-2xl min-h-24"
        />
        <p className="text-xs text-muted-foreground text-right">{descripcion.length}/{MAX_DESC}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram (opcional)</Label>
          <div className="flex items-center rounded-2xl border border-input bg-background h-12 px-3">
            <span className="text-muted-foreground mr-1">@</span>
            <input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/\s/g, ''))}
              placeholder="tuproductora"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono de contacto (opcional)</Label>
          <Input
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="11 5555 5555"
            className="h-12 rounded-2xl"
          />
        </div>
      </div>

      {showContactEmail && (
        <div className="space-y-1.5">
          <Label htmlFor="emailContacto">Email de contacto (opcional)</Label>
          <Input
            id="emailContacto"
            type="email"
            value={emailContacto}
            onChange={(e) => setEmailContacto(e.target.value)}
            placeholder="contacto@tuproductora.com"
            className="h-12 rounded-2xl"
          />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full h-14 rounded-2xl brand-gradient-bg text-primary-foreground font-display font-semibold text-base soft-shadow"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (submitLabel ?? 'Crear productora y empezar')}
      </Button>
    </div>
  );
}
