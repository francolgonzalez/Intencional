'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { formatCurrency, formatDate, generateWhatsAppUrl } from '@/lib/utils';
import type { Cliente, Visita } from '@/types/database';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useSupabase();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Cliente>>({});

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      setCliente(c);
      setForm(c || {});

      const { data: v } = await supabase
        .from('visitas')
        .select('*')
        .eq('cliente_id', id)
        .order('fecha', { ascending: false })
        .limit(20);
      setVisitas(v || []);
    }
    load();
  }, [supabase, id]);

  async function handleSave() {
    await supabase
      .from('clientes')
      .update({
        nombre_local: form.nombre_local,
        direccion: form.direccion,
        telefono: form.telefono,
        horario_atencion: form.horario_atencion,
        notas: form.notas,
      })
      .eq('id', id);
    setCliente({ ...cliente!, ...form });
    setEditing(false);
  }

  if (!cliente) return <p className="text-brand-muted text-center py-8">Cargando...</p>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-brand-muted hover:text-brand-white">
        ← Volver
      </button>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="badge-rose">#{cliente.numero_cliente}</span>
            {editing ? (
              <input
                value={form.nombre_local || ''}
                onChange={(e) => setForm({ ...form, nombre_local: e.target.value })}
                className="input mt-2 w-full"
              />
            ) : (
              <h2 className="text-lg font-bold mt-1">{cliente.nombre_local}</h2>
            )}
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={editing ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            {editing ? 'Guardar' : 'Editar'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm">
          <div>
            <span className="text-brand-muted">Dirección: </span>
            {editing ? (
              <input value={form.direccion || ''} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="input w-full mt-1" />
            ) : (
              <span>{cliente.direccion || '—'}</span>
            )}
          </div>
          <div>
            <span className="text-brand-muted">Teléfono: </span>
            {editing ? (
              <input value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input w-full mt-1" />
            ) : (
              cliente.telefono ? (
                <a href={generateWhatsAppUrl(cliente.telefono, '')} target="_blank" className="text-brand-rose hover:underline">
                  {cliente.telefono}
                </a>
              ) : <span>—</span>
            )}
          </div>
          <div>
            <span className="text-brand-muted">Horario: </span>
            {editing ? (
              <input value={form.horario_atencion || ''} onChange={(e) => setForm({ ...form, horario_atencion: e.target.value })} className="input w-full mt-1" />
            ) : (
              <span>{cliente.horario_atencion || '—'}</span>
            )}
          </div>
          <div>
            <span className="text-brand-muted">Notas: </span>
            {editing ? (
              <textarea value={form.notas || ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="input w-full mt-1" rows={2} />
            ) : (
              <span>{cliente.notas || '—'}</span>
            )}
          </div>
        </div>

        {cliente.saldo_deuda > 0 && (
          <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
            <p className="text-yellow-400 font-medium">
              Deuda actual: {formatCurrency(cliente.saldo_deuda)}
            </p>
          </div>
        )}
      </div>

      {/* Historial de visitas */}
      <div>
        <h3 className="text-sm font-medium text-brand-muted mb-3">Historial de visitas</h3>
        <div className="space-y-2">
          {visitas.map((v) => (
            <div key={v.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{formatDate(v.fecha)}</p>
                <p className="text-xs text-brand-muted">{v.unidades} uds × {formatCurrency(v.precio_unitario)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(v.total)}</p>
                <div className="flex gap-1 mt-0.5">
                  {v.monto_efectivo > 0 && <span className="badge-green">Ef</span>}
                  {v.monto_transferencia > 0 && <span className="badge text-blue-400 bg-blue-500/20">Tr</span>}
                  {v.monto_deuda > 0 && <span className="badge-yellow">De</span>}
                </div>
              </div>
            </div>
          ))}
          {visitas.length === 0 && (
            <p className="text-brand-muted text-center py-4">Sin visitas registradas</p>
          )}
        </div>
      </div>
    </div>
  );
}
