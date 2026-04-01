'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatCurrency } from '@/lib/utils';
import type { Ruta } from '@/types/database';

interface RutaConStats extends Ruta {
  total_clientes: number;
  visitados_hoy: number;
  recaudacion_hoy: number;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function RutasPage() {
  const supabase = useSupabase();
  const { profile, loading: userLoading } = useUser();
  const [rutas, setRutas] = useState<RutaConStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [nuevaRuta, setNuevaRuta] = useState({ nombre: '', descripcion: '', dia_semana: '' });

  useEffect(() => {
    if (userLoading) return;
    if (!profile) { setLoading(false); return; }
    loadRutas();
  }, [profile, userLoading]);

  async function loadRutas() {
    if (!profile) return;
    const hoy = new Date().toISOString().split('T')[0];

    const { data: rutasData } = await supabase
      .from('rutas')
      .select('*')
      .eq('conductor_id', profile.id)
      .eq('activa', true);

    if (!rutasData) { setLoading(false); return; }

    const rutasConStats: RutaConStats[] = await Promise.all(
      rutasData.map(async (ruta) => {
        const { count: totalClientes } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('ruta_id', ruta.id);

        const { data: rutaDiaria } = await supabase
          .from('ruta_diaria')
          .select('visitado')
          .eq('ruta_id', ruta.id)
          .eq('fecha', hoy);

        const visitados = rutaDiaria?.filter((r) => r.visitado).length ?? 0;

        const { data: visitasHoy } = await supabase
          .from('visitas')
          .select('total')
          .eq('ruta_id', ruta.id)
          .eq('fecha', hoy);

        const recaudacion = visitasHoy?.reduce((sum, v) => sum + Number(v.total), 0) ?? 0;

        return {
          ...ruta,
          total_clientes: totalClientes ?? 0,
          visitados_hoy: visitados,
          recaudacion_hoy: recaudacion,
        };
      })
    );

    setRutas(rutasConStats);
    setLoading(false);
  }

  async function crearRuta(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    await supabase.from('rutas').insert({
      nombre: nuevaRuta.nombre,
      descripcion: nuevaRuta.descripcion || null,
      conductor_id: profile.id,
      dia_semana: nuevaRuta.dia_semana ? parseInt(nuevaRuta.dia_semana) : null,
    });

    setCreando(false);
    setNuevaRuta({ nombre: '', descripcion: '', dia_semana: '' });
    loadRutas();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Rutas</h2>
        <button onClick={() => setCreando(!creando)} className="btn-primary text-sm">
          {creando ? 'Cancelar' : '+ Nueva ruta'}
        </button>
      </div>

      {creando && (
        <form onSubmit={crearRuta} className="card space-y-3">
          <input
            value={nuevaRuta.nombre}
            onChange={(e) => setNuevaRuta({ ...nuevaRuta, nombre: e.target.value })}
            className="input w-full"
            placeholder="Nombre de la ruta"
            required
          />
          <input
            value={nuevaRuta.descripcion}
            onChange={(e) => setNuevaRuta({ ...nuevaRuta, descripcion: e.target.value })}
            className="input w-full"
            placeholder="Descripción (opcional)"
          />
          <select
            value={nuevaRuta.dia_semana}
            onChange={(e) => setNuevaRuta({ ...nuevaRuta, dia_semana: e.target.value })}
            className="input w-full"
          >
            <option value="">Día de la semana (opcional)</option>
            {DIAS.map((dia, i) => (
              <option key={i} value={i}>{dia}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary w-full">Crear ruta</button>
        </form>
      )}

      {loading ? (
        <p className="text-brand-muted text-center py-8">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {rutas.map((ruta) => (
            <Link key={ruta.id} href={`/rutas/${ruta.id}`} className="card block hover:border-brand-rose/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{ruta.nombre}</h3>
                {ruta.dia_semana !== null && (
                  <span className="badge-rose">{DIAS[ruta.dia_semana]}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{ruta.total_clientes}</p>
                  <p className="text-xs text-brand-muted">Clientes</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand-rose">
                    {ruta.visitados_hoy}/{ruta.total_clientes}
                  </p>
                  <p className="text-xs text-brand-muted">Visitados</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(ruta.recaudacion_hoy)}
                  </p>
                  <p className="text-xs text-brand-muted">Recaudado</p>
                </div>
              </div>
              {ruta.total_clientes > 0 && (
                <div className="mt-2 w-full bg-brand-dark rounded-full h-1.5">
                  <div
                    className="bg-brand-rose h-1.5 rounded-full transition-all"
                    style={{ width: `${(ruta.visitados_hoy / ruta.total_clientes) * 100}%` }}
                  />
                </div>
              )}
            </Link>
          ))}
          {rutas.length === 0 && (
            <p className="text-brand-muted text-center py-8">No hay rutas creadas</p>
          )}
        </div>
      )}
    </div>
  );
}
