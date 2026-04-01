'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDateLong } from '@/lib/utils';
import type { FacturacionDiaria } from '@/types/database';

export default function DashboardPage() {
  const supabase = useSupabase();
  const { profile, loading: userLoading } = useUser();
  const [facturacionHoy, setFacturacionHoy] = useState<FacturacionDiaria | null>(null);
  const [totalesCombinados, setTotalesCombinados] = useState({
    total: 0, efectivo: 0, transferencia: 0, deuda: 0, visitas: 0, unidades: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!profile) return;

    async function loadData() {
      try {
        const hoy = new Date().toISOString().split('T')[0];
        const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString().split('T')[0];

        // Facturación de hoy (maybeSingle en vez de single para evitar error si no hay datos)
        const { data: dataHoy } = await supabase
          .from('v_facturacion_diaria')
          .select('*')
          .eq('conductor_id', profile!.id)
          .eq('fecha', hoy)
          .maybeSingle();

        setFacturacionHoy(dataHoy);

        // Facturación del mes
        const { data: dataMes } = await supabase
          .from('v_facturacion_diaria')
          .select('*')
          .gte('fecha', primerDiaMes)
          .lte('fecha', hoy);

        if (dataMes && dataMes.length > 0) {
          const totales = dataMes.reduce(
            (acc, row) => ({
              total: acc.total + Number(row.total_facturado),
              efectivo: acc.efectivo + Number(row.total_efectivo),
              transferencia: acc.transferencia + Number(row.total_transferencia),
              deuda: acc.deuda + Number(row.total_deuda),
              visitas: acc.visitas + Number(row.total_visitas),
              unidades: acc.unidades + Number(row.total_unidades),
            }),
            { total: 0, efectivo: 0, transferencia: 0, deuda: 0, visitas: 0, unidades: 0 }
          );
          setTotalesCombinados(totales);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, profile, userLoading]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-sm text-brand-muted">{formatDateLong(new Date())}</p>
      </div>

      {/* Facturación del día */}
      <div>
        <h3 className="text-sm font-medium text-brand-muted mb-3">Facturación de hoy</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card">
            <p className="stat-label">Total</p>
            <p className="stat-value">{formatCurrency(facturacionHoy?.total_facturado ?? 0)}</p>
          </div>
          <div className="card">
            <p className="stat-label">Efectivo</p>
            <p className="stat-value text-green-400">{formatCurrency(facturacionHoy?.total_efectivo ?? 0)}</p>
          </div>
          <div className="card">
            <p className="stat-label">Transferencia</p>
            <p className="stat-value text-blue-400">{formatCurrency(facturacionHoy?.total_transferencia ?? 0)}</p>
          </div>
          <div className="card">
            <p className="stat-label">Deuda</p>
            <p className="stat-value text-yellow-400">{formatCurrency(facturacionHoy?.total_deuda ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Stats del día */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="stat-label">Visitas hoy</p>
          <p className="stat-value">{facturacionHoy?.total_visitas ?? 0}</p>
        </div>
        <div className="card">
          <p className="stat-label">Unidades hoy</p>
          <p className="stat-value">{facturacionHoy?.total_unidades ?? 0}</p>
        </div>
      </div>

      {/* Totales combinados del mes */}
      <div>
        <h3 className="text-sm font-medium text-brand-muted mb-3">
          Totales combinados — {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="card border-brand-rose/30">
            <p className="stat-label">Facturado total</p>
            <p className="stat-value text-brand-rose">{formatCurrency(totalesCombinados.total)}</p>
          </div>
          <div className="card">
            <p className="stat-label">Efectivo mes</p>
            <p className="stat-value text-green-400">{formatCurrency(totalesCombinados.efectivo)}</p>
          </div>
          <div className="card">
            <p className="stat-label">Transferencia mes</p>
            <p className="stat-value text-blue-400">{formatCurrency(totalesCombinados.transferencia)}</p>
          </div>
          <div className="card">
            <p className="stat-label">Deuda mes</p>
            <p className="stat-value text-yellow-400">{formatCurrency(totalesCombinados.deuda)}</p>
          </div>
          <div className="card">
            <p className="stat-label">Visitas mes</p>
            <p className="stat-value">{totalesCombinados.visitas}</p>
          </div>
          <div className="card">
            <p className="stat-label">Unidades mes</p>
            <p className="stat-value">{totalesCombinados.unidades}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
