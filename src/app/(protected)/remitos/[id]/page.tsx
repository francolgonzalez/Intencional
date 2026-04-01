'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate, generateWhatsAppUrl } from '@/lib/utils';
import { generarMensajeRemito } from '@/lib/whatsapp';
import type { Remito, Visita, Cliente } from '@/types/database';

export default function RemitoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useSupabase();
  const { profile } = useUser();
  const router = useRouter();
  const [remito, setRemito] = useState<Remito | null>(null);
  const [visita, setVisita] = useState<Visita | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    async function load() {
      const { data: r } = await supabase
        .from('remitos')
        .select('*')
        .eq('id', id)
        .single();
      setRemito(r);

      if (r) {
        const { data: v } = await supabase
          .from('visitas')
          .select('*')
          .eq('id', r.visita_id)
          .single();
        setVisita(v);

        const { data: c } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', r.cliente_id)
          .single();
        setCliente(c);
      }
    }
    load();
  }, [supabase, id]);

  async function generarPDF() {
    if (!remito || !visita || !cliente || !profile) return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('INTENCIONAL', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Distribución de esmaltes', 105, 27, { align: 'center' });

    // Remito info
    doc.setFontSize(12);
    doc.text(`Remito #${remito.numero_remito}`, 20, 45);
    doc.text(`Fecha: ${formatDate(remito.fecha)}`, 20, 52);
    doc.text(`Conductor: ${profile.nombre}`, 20, 59);

    // Cliente
    doc.setFontSize(11);
    doc.text('Cliente:', 20, 75);
    doc.text(`${cliente.nombre_local} (#${cliente.numero_cliente})`, 20, 82);
    if (cliente.direccion) doc.text(cliente.direccion, 20, 89);

    // Detalle
    doc.setFontSize(10);
    const y = 105;
    doc.text('Descripción', 20, y);
    doc.text('Cant.', 100, y);
    doc.text('P.Unit.', 130, y);
    doc.text('Subtotal', 165, y);
    doc.line(20, y + 2, 190, y + 2);

    doc.text('Esmaltes Intencional', 20, y + 10);
    doc.text(String(visita.unidades), 100, y + 10);
    doc.text(`$${visita.precio_unitario.toLocaleString()}`, 130, y + 10);
    doc.text(`$${visita.total.toLocaleString()}`, 165, y + 10);

    doc.line(20, y + 15, 190, y + 15);
    doc.setFontSize(12);
    doc.text(`TOTAL: $${visita.total.toLocaleString()}`, 165, y + 25, { align: 'right' });

    // Pago
    doc.setFontSize(10);
    const yPago = y + 35;
    doc.text('Forma de pago:', 20, yPago);
    if (visita.monto_efectivo > 0) doc.text(`Efectivo: $${visita.monto_efectivo.toLocaleString()}`, 30, yPago + 7);
    if (visita.monto_transferencia > 0) doc.text(`Transferencia: $${visita.monto_transferencia.toLocaleString()}`, 30, yPago + 14);
    if (visita.monto_deuda > 0) doc.text(`Deuda: $${visita.monto_deuda.toLocaleString()}`, 30, yPago + 21);

    doc.save(`remito-${remito.numero_remito}.pdf`);
  }

  if (!remito || !visita || !cliente) {
    return <p className="text-brand-muted text-center py-8">Cargando...</p>;
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-sm text-brand-muted hover:text-brand-white">
        ← Volver
      </button>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Remito #{remito.numero_remito}</h2>
          <span className={`badge ${remito.estado === 'generado' ? 'badge-yellow' : remito.estado === 'enviado' ? 'badge-green' : 'badge-rose'}`}>
            {remito.estado}
          </span>
        </div>

        <div className="text-sm space-y-1">
          <p><span className="text-brand-muted">Fecha:</span> {formatDate(remito.fecha)}</p>
          <p><span className="text-brand-muted">Cliente:</span> {cliente.nombre_local} (#{cliente.numero_cliente})</p>
          {cliente.direccion && <p><span className="text-brand-muted">Dirección:</span> {cliente.direccion}</p>}
        </div>

        <div className="border-t border-brand-border pt-3">
          <div className="flex justify-between text-sm">
            <span>Esmaltes × {visita.unidades}</span>
            <span>{formatCurrency(visita.precio_unitario)} c/u</span>
          </div>
          <div className="flex justify-between mt-2 text-lg font-bold">
            <span>Total</span>
            <span className="text-brand-rose">{formatCurrency(visita.total)}</span>
          </div>
        </div>

        <div className="border-t border-brand-border pt-3 text-sm space-y-1">
          {visita.monto_efectivo > 0 && <p className="text-green-400">Efectivo: {formatCurrency(visita.monto_efectivo)}</p>}
          {visita.monto_transferencia > 0 && <p className="text-blue-400">Transferencia: {formatCurrency(visita.monto_transferencia)}</p>}
          {visita.monto_deuda > 0 && <p className="text-yellow-400">Deuda: {formatCurrency(visita.monto_deuda)}</p>}
        </div>

        {visita.observaciones && (
          <div className="border-t border-brand-border pt-3">
            <p className="text-sm text-brand-muted">{visita.observaciones}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button onClick={generarPDF} className="btn-primary w-full">
          📄 Descargar PDF
        </button>

        {cliente.telefono && profile && (
          <a
            href={generateWhatsAppUrl(
              cliente.telefono,
              generarMensajeRemito(cliente.nombre_local, visita.unidades, visita.total, profile.nombre)
            )}
            target="_blank"
            className="btn-secondary w-full inline-block text-center"
          >
            📱 Enviar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
