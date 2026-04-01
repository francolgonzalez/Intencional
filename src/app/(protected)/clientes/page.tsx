'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatCurrency } from '@/lib/utils';
import type { Cliente } from '@/types/database';

export default function ClientesPage() {
  const supabase = useSupabase();
  const { profile, loading: userLoading } = useUser();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!profile) { setLoading(false); return; }

    async function loadClientes() {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('conductor_id', profile!.id)
        .eq('activo', true)
        .order('numero_cliente');

      setClientes(data || []);
      setLoading(false);
    }

    loadClientes();
  }, [supabase, profile, userLoading]);

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.nombre_local.toLowerCase().includes(q) ||
      c.numero_cliente.toString().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Clientes</h2>
        <Link href="/clientes/nuevo" className="btn-primary text-sm">
          + Nuevo
        </Link>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o número..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="input w-full"
      />

      {loading ? (
        <p className="text-brand-muted text-center py-8">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {filtrados.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="card flex items-center justify-between hover:border-brand-rose/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-rose font-mono text-sm">#{cliente.numero_cliente}</span>
                  <span className="font-medium">{cliente.nombre_local}</span>
                </div>
                {cliente.direccion && (
                  <p className="text-xs text-brand-muted mt-0.5">{cliente.direccion}</p>
                )}
              </div>
              <div className="text-right">
                {cliente.saldo_deuda > 0 && (
                  <p className="text-yellow-400 text-sm font-medium">
                    {formatCurrency(cliente.saldo_deuda)}
                  </p>
                )}
              </div>
            </Link>
          ))}
          {filtrados.length === 0 && (
            <p className="text-brand-muted text-center py-8">
              {busqueda ? 'Sin resultados' : 'No hay clientes cargados'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
