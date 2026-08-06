import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Productora = {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  descripcion: string | null;
  instagram: string | null;
  telefono_contacto: string | null;
  email_contacto: string | null;
};

export function slugify(nombre: string) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'productora';
}

export function useProductora() {
  const { user } = useAuth();
  const [productora, setProductora] = useState<Productora | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProductora(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.rpc('get_my_productora');
    setProductora(((data as Productora[] | null) ?? [])[0] ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  return { productora, loading, refresh, setProductora };
}
