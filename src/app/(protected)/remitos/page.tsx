'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Remito } from '@/types/database';

interface RemitoConCliente extends Remito {
  cliente: { nombre_local: string; numero_cliente: number };
}

export default function RemitosPage() {
  const supabase = useSupabase();
  const { profile, loading: userLoading } = useUser();
  const [remitos, setRemitos] = useState<RemitoConCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!profile) { setLoading(false); return; }

    async function load() {
      const { data } = await supabase
        .from('remitos')
        .select('*, cliente:clientes(nombre_local, numero_cliente)')
        .eq('conductor_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setRemitos((data as unknown as RemitoConCliente[]) || []);
      setLoading(false);
    }
    load();
  }, [supabase, profile, userLoading]);

  const estadoBadge = {
    generado: 'badge-yellow',
    enviado: 'badge-green',
    facturado: 'badge-rose',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Remitos</h2>

      {loading ? (
        <p className="text-brand-muted text-center py-8">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {remitos.map((remito) => (
            <Link
              key={remito.id}
              href={`/remitos/${remito.id}`}
              className="card flex items-center justify-between hover:border-brand-rose/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-brand-muted">#{remito.numero_remito}</span>
                  <span className="font-medium">{remito.cliente.nombre_local}</span>
                </div>
                <p className="text-xs text-brand-muted">{formatDate(remito.fecha)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(remito.total)}</p>
                <span className={estadoBadge[remito.estado]}>{remito.estado}</span>
              </div>
            </Link>
          ))}
          {remitos.length === 0 && (
            <p className="text-brand-muted text-center py-8">No hay remitos generados</p>
          )}
        </div>
      )}
    </div>
  );
}
