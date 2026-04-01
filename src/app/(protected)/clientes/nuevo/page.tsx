'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import type { Ruta } from '@/types/database';

export default function NuevoClientePage() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const router = useRouter();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numero_cliente: '',
    nombre_local: '',
    direccion: '',
    telefono: '',
    ruta_id: '',
    horario_atencion: '',
    notas: '',
  });

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('rutas')
      .select('*')
      .eq('conductor_id', profile.id)
      .eq('activa', true)
      .then(({ data }) => setRutas(data || []));
  }, [supabase, profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const { error } = await supabase.from('clientes').insert({
      numero_cliente: parseInt(form.numero_cliente),
      nombre_local: form.nombre_local,
      direccion: form.direccion || null,
      telefono: form.telefono || null,
      ruta_id: form.ruta_id || null,
      conductor_id: profile.id,
      horario_atencion: form.horario_atencion || null,
      notas: form.notas || null,
    });

    if (!error) {
      router.push('/clientes');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4 max-w-lg">
      <button onClick={() => router.back()} className="text-sm text-brand-muted hover:text-brand-white">
        ← Volver
      </button>

      <h2 className="text-xl font-bold">Nuevo cliente</h2>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Número de cliente</label>
          <input
            type="number"
            value={form.numero_cliente}
            onChange={(e) => setForm({ ...form, numero_cliente: e.target.value })}
            className="input w-full"
            placeholder="1001"
            required
          />
        </div>
        <div>
          <label className="label">Nombre del local</label>
          <input
            value={form.nombre_local}
            onChange={(e) => setForm({ ...form, nombre_local: e.target.value })}
            className="input w-full"
            required
          />
        </div>
        <div>
          <label className="label">Dirección</label>
          <input
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="input w-full"
          />
        </div>
        <div>
          <label className="label">Teléfono (WhatsApp)</label>
          <input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="input w-full"
            placeholder="11 1234-5678"
          />
        </div>
        <div>
          <label className="label">Ruta</label>
          <select
            value={form.ruta_id}
            onChange={(e) => setForm({ ...form, ruta_id: e.target.value })}
            className="input w-full"
          >
            <option value="">Sin ruta</option>
            {rutas.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Horario de atención</label>
          <input
            value={form.horario_atencion}
            onChange={(e) => setForm({ ...form, horario_atencion: e.target.value })}
            className="input w-full"
            placeholder="9:00 - 18:00"
          />
        </div>
        <div>
          <label className="label">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            className="input w-full"
            rows={2}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Guardando...' : 'Crear cliente'}
        </button>
      </form>
    </div>
  );
}
