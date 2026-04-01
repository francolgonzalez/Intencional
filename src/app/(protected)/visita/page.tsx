'use client';

import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, PRECIO_UNITARIO_DEFAULT, generateWhatsAppUrl } from '@/lib/utils';
import { generarMensajeRemito } from '@/lib/whatsapp';
import type { Cliente } from '@/types/database';

export default function VisitaPage() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [unidades, setUnidades] = useState(0);
  const [precioUnitario, setPrecioUnitario] = useState(PRECIO_UNITARIO_DEFAULT);
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTransferencia, setMontoTransferencia] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [visitaGuardada, setVisitaGuardada] = useState(false);

  const total = unidades * precioUnitario;
  const montoDeuda = Math.max(0, total - montoEfectivo - montoTransferencia);

  async function buscarCliente(q: string) {
    setBusqueda(q);
    if (q.length < 2 || !profile) return;

    const isNumero = /^\d+$/.test(q);
    let query = supabase
      .from('clientes')
      .select('*')
      .eq('conductor_id', profile.id)
      .eq('activo', true)
      .limit(10);

    if (isNumero) {
      query = query.eq('numero_cliente', parseInt(q));
    } else {
      query = query.ilike('nombre_local', `%${q}%`);
    }

    const { data } = await query;
    setResultados(data || []);
  }

  function seleccionarCliente(c: Cliente) {
    setClienteSeleccionado(c);
    setResultados([]);
    setBusqueda(`#${c.numero_cliente} — ${c.nombre_local}`);
  }

  async function guardarVisita() {
    if (!clienteSeleccionado || !profile || unidades <= 0) return;
    setSaving(true);

    const { data: visita, error } = await supabase
      .from('visitas')
      .insert({
        cliente_id: clienteSeleccionado.id,
        conductor_id: profile.id,
        ruta_id: clienteSeleccionado.ruta_id,
        unidades,
        precio_unitario: precioUnitario,
        total,
        monto_efectivo: montoEfectivo,
        monto_transferencia: montoTransferencia,
        monto_deuda: montoDeuda,
        observaciones: observaciones || null,
      })
      .select()
      .single();

    if (!error && visita) {
      // Crear remito
      await supabase.from('remitos').insert({
        visita_id: visita.id,
        cliente_id: clienteSeleccionado.id,
        conductor_id: profile.id,
        total,
      });

      setVisitaGuardada(true);
    }

    setSaving(false);
  }

  function nuevaVisita() {
    setClienteSeleccionado(null);
    setBusqueda('');
    setUnidades(0);
    setPrecioUnitario(PRECIO_UNITARIO_DEFAULT);
    setMontoEfectivo(0);
    setMontoTransferencia(0);
    setObservaciones('');
    setVisitaGuardada(false);
  }

  if (visitaGuardada && clienteSeleccionado) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="card text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-bold">Visita registrada</h2>
          <p className="text-brand-muted">
            {clienteSeleccionado.nombre_local} — {unidades} uds — {formatCurrency(total)}
          </p>

          {clienteSeleccionado.telefono && (
            <a
              href={generateWhatsAppUrl(
                clienteSeleccionado.telefono,
                generarMensajeRemito(clienteSeleccionado.nombre_local, unidades, total, profile?.nombre || '')
              )}
              target="_blank"
              className="btn-primary w-full inline-block text-center"
            >
              📱 Enviar remito por WhatsApp
            </a>
          )}

          <button onClick={nuevaVisita} className="btn-secondary w-full">
            Nueva visita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold">Visita del día</h2>

      {/* Buscar cliente */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por número o nombre..."
          value={busqueda}
          onChange={(e) => buscarCliente(e.target.value)}
          className="input w-full"
        />
        {resultados.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-brand-card border border-brand-border rounded-lg overflow-hidden shadow-lg">
            {resultados.map((c) => (
              <button
                key={c.id}
                onClick={() => seleccionarCliente(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-brand-dark transition-colors border-b border-brand-border last:border-0"
              >
                <span className="text-brand-rose font-mono text-sm">#{c.numero_cliente}</span>
                <span className="ml-2">{c.nombre_local}</span>
                {c.direccion && (
                  <span className="text-xs text-brand-muted block">{c.direccion}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {clienteSeleccionado && (
        <div className="space-y-4">
          {/* Info cliente */}
          <div className="card bg-brand-rose/5 border-brand-rose/20">
            <p className="font-medium">{clienteSeleccionado.nombre_local}</p>
            <p className="text-xs text-brand-muted">{clienteSeleccionado.direccion}</p>
            {clienteSeleccionado.saldo_deuda > 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                Deuda: {formatCurrency(clienteSeleccionado.saldo_deuda)}
              </p>
            )}
          </div>

          {/* Formulario de venta */}
          <div className="card space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Unidades</label>
                <input
                  type="number"
                  value={unidades || ''}
                  onChange={(e) => setUnidades(parseInt(e.target.value) || 0)}
                  className="input w-full text-center text-lg"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Precio unitario</label>
                <input
                  type="number"
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(parseInt(e.target.value) || 0)}
                  className="input w-full text-center"
                />
              </div>
            </div>

            <div className="p-3 bg-brand-dark rounded-lg text-center">
              <p className="stat-label">Total</p>
              <p className="text-2xl font-bold text-brand-rose">{formatCurrency(total)}</p>
            </div>

            <div>
              <label className="label">Método de pago</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-brand-muted">Efectivo</label>
                  <input
                    type="number"
                    value={montoEfectivo || ''}
                    onChange={(e) => setMontoEfectivo(parseInt(e.target.value) || 0)}
                    className="input w-full"
                    placeholder="$0"
                  />
                </div>
                <div>
                  <label className="text-xs text-brand-muted">Transferencia</label>
                  <input
                    type="number"
                    value={montoTransferencia || ''}
                    onChange={(e) => setMontoTransferencia(parseInt(e.target.value) || 0)}
                    className="input w-full"
                    placeholder="$0"
                  />
                </div>
              </div>
              {montoDeuda > 0 && (
                <p className="text-yellow-400 text-sm mt-2">
                  Queda en deuda: {formatCurrency(montoDeuda)}
                </p>
              )}
            </div>

            <div>
              <label className="label">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="input w-full"
                rows={2}
                placeholder="Opcional..."
              />
            </div>

            <button
              onClick={guardarVisita}
              disabled={saving || unidades <= 0}
              className="btn-primary w-full text-lg py-3"
            >
              {saving ? 'Guardando...' : 'Registrar visita'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
