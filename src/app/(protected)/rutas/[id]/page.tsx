'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import type { Ruta, RutaDiariaConCliente } from '@/types/database';

export default function RutaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useSupabase();
  const { profile } = useUser();
  const router = useRouter();
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [paradas, setParadas] = useState<RutaDiariaConCliente[]>([]);

  useEffect(() => {
    if (!profile) return;

    async function load() {
      const { data: r } = await supabase
        .from('rutas')
        .select('*')
        .eq('id', id)
        .single();
      setRuta(r);

      const hoy = new Date().toISOString().split('T')[0];
      const { data: p } = await supabase
        .from('ruta_diaria')
        .select('*, cliente:clientes(numero_cliente, nombre_local, direccion, telefono, horario_atencion)')
        .eq('ruta_id', id)
        .eq('fecha', hoy)
        .order('orden');
      setParadas((p as unknown as RutaDiariaConCliente[]) || []);
    }
    load();
  }, [supabase, profile, id]);

  async function toggleVisitado(paradaId: string, visitado: boolean) {
    await supabase
      .from('ruta_diaria')
      .update({ visitado: !visitado })
      .eq('id', paradaId);

    setParadas(paradas.map((p) =>
      p.id === paradaId ? { ...p, visitado: !visitado } : p
    ));
  }

  if (!ruta) return <p className="text-brand-muted text-center py-8">Cargando...</p>;

  const visitados = paradas.filter((p) => p.visitado).length;

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-brand-muted hover:text-brand-white">
        ← Volver
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{ruta.nombre}</h2>
        <span className="badge-rose">{visitados}/{paradas.length}</span>
      </div>

      {paradas.length > 0 && (
        <div className="w-full bg-brand-dark rounded-full h-2">
          <div
            className="bg-brand-rose h-2 rounded-full transition-all"
            style={{ width: `${paradas.length > 0 ? (visitados / paradas.length) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {paradas.map((p, i) => (
          <button
            key={p.id}
            onClick={() => toggleVisitado(p.id, p.visitado)}
            className={`card w-full text-left flex items-center gap-3 transition-all ${
              p.visitado ? 'opacity-50 border-green-500/30' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              p.visitado ? 'bg-green-500/20 text-green-400' : 'bg-brand-dark text-brand-muted'
            }`}>
              {p.visitado ? '✓' : i + 1}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-brand-rose font-mono text-xs">#{p.cliente.numero_cliente}</span>
                <span className="font-medium truncate">{p.cliente.nombre_local}</span>
              </div>
              {p.cliente.direccion && (
                <p className="text-xs text-brand-muted truncate">{p.cliente.direccion}</p>
              )}
              {p.cliente.horario_atencion && (
                <p className="text-xs text-brand-muted">🕐 {p.cliente.horario_atencion}</p>
              )}
            </div>
          </button>
        ))}
        {paradas.length === 0 && (
          <p className="text-brand-muted text-center py-8">No hay paradas para hoy en esta ruta</p>
        )}
      </div>
    </div>
  );
}
