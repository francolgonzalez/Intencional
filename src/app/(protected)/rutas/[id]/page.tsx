'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import type { Ruta, Cliente } from '@/types/database';

export default function RutaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useSupabase();
  const { profile } = useUser();
  const router = useRouter();

  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [visitados, setVisitados] = useState<Set<string>>(new Set());

  // Edit form state
  const [editando, setEditando] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editDiaSemana, setEditDiaSemana] = useState<number | ''>('');
  const [guardando, setGuardando] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile) return;

    async function load() {
      const { data: r } = await supabase
        .from('rutas')
        .select('*')
        .eq('id', id)
        .single();
      setRuta(r);

      const { data: c } = await supabase
        .from('clientes')
        .select('*')
        .eq('ruta_id', id)
        .eq('activo', true)
        .order('numero_cliente');
      setClientes((c as Cliente[]) || []);

      const { data: rd } = await supabase
        .from('ruta_diaria')
        .select('cliente_id')
        .eq('ruta_id', id)
        .eq('fecha', today)
        .eq('visitado', true);

      if (rd && rd.length > 0) {
        setVisitados(new Set(rd.map((row: { cliente_id: string }) => row.cliente_id)));
      }
    }
    load();
  }, [supabase, profile, id, today]);

  async function toggleVisitado(clienteId: string, index: number) {
    const eraVisitado = visitados.has(clienteId);
    const newSet = new Set(visitados);

    if (eraVisitado) {
      newSet.delete(clienteId);
      setVisitados(newSet);
      await supabase
        .from('ruta_diaria')
        .delete()
        .eq('ruta_id', id)
        .eq('cliente_id', clienteId)
        .eq('fecha', today);
    } else {
      newSet.add(clienteId);
      setVisitados(newSet);
      await supabase
        .from('ruta_diaria')
        .upsert({ ruta_id: id, cliente_id: clienteId, fecha: today, visitado: true, orden: index });
    }
  }

  function abrirEdicion() {
    if (!ruta) return;
    setEditNombre(ruta.nombre);
    setEditDescripcion(ruta.descripcion || '');
    setEditDiaSemana(ruta.dia_semana ?? '');
    setEditando(true);
  }

  async function guardarEdicion() {
    if (!ruta) return;
    setGuardando(true);
    await supabase
      .from('rutas')
      .update({
        nombre: editNombre,
        descripcion: editDescripcion || null,
        dia_semana: editDiaSemana === '' ? null : Number(editDiaSemana),
      })
      .eq('id', id);

    const { data: r } = await supabase
      .from('rutas')
      .select('*')
      .eq('id', id)
      .single();
    setRuta(r);
    setGuardando(false);
    setEditando(false);
  }

  if (!ruta) return <p className="text-brand-muted text-center py-8">Cargando...</p>;

  const visitadosCount = visitados.size;
  const total = clientes.length;
  const progreso = total > 0 ? (visitadosCount / total) * 100 : 0;

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-brand-muted hover:text-brand-text">
        ← Volver
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{ruta.nombre}</h2>
          <button
            onClick={abrirEdicion}
            className="text-brand-muted hover:text-brand-text transition-colors"
            title="Editar ruta"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <span className="badge-rose">{visitadosCount}/{total}</span>
      </div>

      {/* Edit form */}
      {editando && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-brand-text">Editar ruta</h3>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Nombre</label>
            <input
              className="input w-full"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Descripción</label>
            <input
              className="input w-full"
              value={editDescripcion}
              onChange={(e) => setEditDescripcion(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Día de la semana</label>
            <select
              className="input w-full"
              value={editDiaSemana}
              onChange={(e) => setEditDiaSemana(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Sin día asignado</option>
              {diasSemana.map((dia, i) => (
                <option key={i} value={i}>{dia}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={guardarEdicion}
              disabled={guardando}
              className="btn-primary text-sm"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="btn-secondary text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-brand-border rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #9B6BB5, #C84B8C)' }}
          />
        </div>
      )}

      {/* Client list */}
      <div className="space-y-2">
        {clientes.map((c, i) => {
          const visitado = visitados.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleVisitado(c.id, i)}
              className={`card w-full text-left flex items-center gap-3 transition-all ${
                visitado ? 'opacity-50' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                visitado ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-subtle text-brand-muted'
              }`}>
                {visitado ? '✓' : i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-brand-rose font-mono text-xs">#{c.numero_cliente}</span>
                  <span className="font-medium truncate">{c.nombre_local}</span>
                </div>
                {c.direccion && (
                  <p className="text-xs text-brand-muted truncate">{c.direccion}</p>
                )}
                {c.horario_atencion && (
                  <p className="text-xs text-brand-muted">{c.horario_atencion}</p>
                )}
              </div>
            </button>
          );
        })}
        {clientes.length === 0 && (
          <p className="text-brand-muted text-center py-8">No hay clientes asignados a esta ruta</p>
        )}
      </div>
    </div>
  );
}
