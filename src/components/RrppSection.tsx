import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

type Rrpp = { id: string; name: string; contact: string | null };

export function RrppSection() {
  const { user } = useAuth();
  const [rrpps, setRrpps] = useState<Rrpp[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', contact: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('rrpps').select('id, name, contact')
      .eq('organizer_id', user.id).order('created_at', { ascending: false });
    setRrpps((data ?? []) as Rrpp[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const add = async () => {
    if (!user || !form.name.trim()) return toast.error('Ingresá un nombre');
    setSaving(true);
    const { error } = await supabase.from('rrpps').insert({
      organizer_id: user.id, name: form.name.trim(), contact: form.contact.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setForm({ name: '', contact: '' });
    toast.success('RRPP creado');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('rrpps').delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card className="glass-card border-border/60 rounded-2xl">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Megaphone className="h-4 w-4" /> Mis RRPPs
        </CardTitle>
        <CardDescription>Gestioná tu equipo de RRPPs. Después asignalos a eventos desde el detalle.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-2xl" />
          </div>
          <div>
            <Label>Contacto (opcional)</Label>
            <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="rounded-2xl" />
          </div>
          <Button onClick={add} disabled={saving} className="rounded-full brand-gradient-bg text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Agregar</>}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : rrpps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Todavía no tenés RRPPs cargados.</p>
        ) : (
          <div className="space-y-2">
            {rrpps.map(r => (
              <div key={r.id} className="p-3 rounded-xl bg-secondary/30 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  {r.contact && <p className="text-xs text-muted-foreground truncate">{r.contact}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
