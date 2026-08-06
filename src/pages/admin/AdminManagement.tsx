import { useEffect, useState } from 'react';
import { adminRpc, formatDate } from '@/lib/admin';
import { PageHead, Spinner, TableShell, EmptyRow, tdClass, AdminCard } from './ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldCheck, UserMinus } from 'lucide-react';

const ERRORS: Record<string, string> = {
  user_not_found: 'No existe una cuenta con ese email. La persona tiene que registrarse primero en Cupo.',
  cannot_remove_self: 'No podés quitarte a vos mismo el acceso de administrador.',
  last_admin: 'Tiene que quedar al menos un administrador activo.',
};

export default function AdminManagement() {
  const { session } = useAdminAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows((await adminRpc<any[]>('admin_list_admins')) ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos cargar los administradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    try {
      const res = await adminRpc<any>('admin_grant_admin', { _email: email.trim() });
      if (!res?.ok) {
        toast.error(ERRORS[res?.error] ?? 'No pudimos dar de alta al administrador');
        return;
      }
      toast.success('Administrador dado de alta');
      setEmail('');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos dar de alta al administrador');
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (r: any) => {
    try {
      const res = await adminRpc<any>('admin_revoke_admin', { _user_id: r.user_id });
      if (!res?.ok) {
        toast.error(ERRORS[res?.error] ?? 'No pudimos quitar el acceso');
        return;
      }
      toast.success('Acceso de administrador removido');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'No pudimos quitar el acceso');
    }
  };

  return (
    <div>
      <PageHead
        title="Administradores"
        description="Cuentas con acceso total al panel. Un administrador no puede comprar entradas ni crear productoras."
      />

      <AdminCard className="p-4 mb-5 max-w-xl">
        <form onSubmit={grant} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Email de la cuenta a promover</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
            />
            <p className="text-xs text-muted-foreground">
              La cuenta tiene que existir en Cupo. Al promoverla se le quitan los roles de comprador y organizador.
            </p>
          </div>
          <Button type="submit" disabled={saving}>
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            {saving ? 'Dando de alta…' : 'Dar de alta administrador'}
          </Button>
        </form>
      </AdminCard>

      {loading ? (
        <Spinner />
      ) : (
        <TableShell cols={['Email', 'Nombre', 'Alta', '', 'Acciones']}>
          {rows.length === 0 ? (
            <EmptyRow span={5} text="No hay administradores registrados." />
          ) : (
            rows.map((r) => (
              <tr key={r.user_id} className="hover:bg-muted/40">
                <td className={tdClass}>{r.email ?? '—'}</td>
                <td className={tdClass}>{r.full_name ?? '—'}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{formatDate(r.created_at)}</td>
                <td className={tdClass}>
                  {r.user_id === session?.user?.id && <Badge variant="secondary">Tu cuenta</Badge>}
                </td>
                <td className={tdClass}>
                  {r.user_id !== session?.user?.id && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revoke(r)}>
                      <UserMinus className="h-3.5 w-3.5 mr-1" /> Quitar acceso
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </TableShell>
      )}
    </div>
  );
}
