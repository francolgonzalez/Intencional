'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDateLong } from '@/lib/utils';
import type { FacturacionDiaria } from '@/types/database';

interface StatCardProps {
  label: string;
  value: string | number;
  valueClass?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ label, value, valueClass, icon, iconBg }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <p className="stat-label">{label}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <p className={`stat-value ${valueClass ?? ''}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const supabase = useSupabase();
  const { profile, loading: userLoading } = useUser();
  const [facturacionHoy, setFacturacionHoy] = useState<FacturacionDiaria | null>(null);
  const [totalesCombinados, setTotalesCombinados] = useState({
    total: 0, efectivo: 0, transferencia: 0, deuda: 0, visitas: 0, unidades: 0,
  });
  const mesNombre = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (userLoading) return;
    if (!profile) return;

    async function loadData() {
      try {
        const hoy = new Date().toISOString().split('T')[0];
        const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString().split('T')[0];

        const { data: dataHoy } = await supabase
          .from('v_facturacion_diaria')
          .select('*')
          .eq('conductor_id', profile!.id)
          .eq('fecha', hoy)
          .maybeSingle();

        setFacturacionHoy(dataHoy);

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
      }
    }

    loadData();
  }, [supabase, profile, userLoading]);

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 border border-brand-border"
        style={{
          background: 'linear-gradient(135deg, rgba(155,107,181,0.07) 0%, rgba(200,75,140,0.04) 50%, rgba(255,255,255,0) 100%)',
        }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'linear-gradient(135deg, #9B6BB5, #C84B8C)' }}
        />
        <div
          className="absolute -bottom-8 -right-4 w-24 h-24 rounded-full opacity-6"
          style={{ background: 'linear-gradient(135deg, #C84B8C, #9B6BB5)' }}
        />

        <div className="relative">
          <h2 className="text-2xl font-bold text-brand-text tracking-tight">Dashboard</h2>
          <p className="text-sm text-brand-muted mt-1">{formatDateLong(new Date())}</p>
        </div>
      </div>

      {/* Facturación de hoy */}
      <section>
        <p className="section-title">Facturación de hoy</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={formatCurrency(facturacionHoy?.total_facturado ?? 0)}
            valueClass="gradient-text"
            iconBg="linear-gradient(135deg, rgba(155,107,181,0.15), rgba(200,75,140,0.15))"
            icon={
              <svg className="w-4 h-4 text-brand-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Efectivo"
            value={formatCurrency(facturacionHoy?.total_efectivo ?? 0)}
            valueClass="text-emerald-600"
            iconBg="rgba(16, 185, 129, 0.12)"
            icon={
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            label="Transferencia"
            value={formatCurrency(facturacionHoy?.total_transferencia ?? 0)}
            valueClass="text-blue-600"
            iconBg="rgba(59, 130, 246, 0.12)"
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          />
          <StatCard
            label="Deuda"
            value={formatCurrency(facturacionHoy?.total_deuda ?? 0)}
            valueClass="text-amber-600"
            iconBg="rgba(245, 158, 11, 0.12)"
            icon={
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Actividad de hoy */}
      <section>
        <p className="section-title">Actividad de hoy</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Visitas"
            value={facturacionHoy?.total_visitas ?? 0}
            iconBg="linear-gradient(135deg, rgba(155,107,181,0.12), rgba(200,75,140,0.12))"
            icon={
              <svg className="w-4 h-4 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Unidades"
            value={facturacionHoy?.total_unidades ?? 0}
            iconBg="linear-gradient(135deg, rgba(200,75,140,0.12), rgba(155,107,181,0.12))"
            icon={
              <svg className="w-4 h-4 text-brand-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Totales del mes */}
      <section>
        <p className="section-title capitalize">
          Totales — {mesNombre}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            label="Facturado total"
            value={formatCurrency(totalesCombinados.total)}
            valueClass="gradient-text"
            iconBg="linear-gradient(135deg, rgba(155,107,181,0.15), rgba(200,75,140,0.15))"
            icon={
              <svg className="w-4 h-4 text-brand-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label="Efectivo mes"
            value={formatCurrency(totalesCombinados.efectivo)}
            valueClass="text-emerald-600"
            iconBg="rgba(16, 185, 129, 0.12)"
            icon={
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            label="Transferencia mes"
            value={formatCurrency(totalesCombinados.transferencia)}
            valueClass="text-blue-600"
            iconBg="rgba(59, 130, 246, 0.12)"
            icon={
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          />
          <StatCard
            label="Deuda mes"
            value={formatCurrency(totalesCombinados.deuda)}
            valueClass="text-amber-600"
            iconBg="rgba(245, 158, 11, 0.12)"
            icon={
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <StatCard
            label="Visitas mes"
            value={totalesCombinados.visitas}
            iconBg="linear-gradient(135deg, rgba(155,107,181,0.12), rgba(200,75,140,0.12))"
            icon={
              <svg className="w-4 h-4 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Unidades mes"
            value={totalesCombinados.unidades}
            iconBg="linear-gradient(135deg, rgba(200,75,140,0.12), rgba(155,107,181,0.12))"
            icon={
              <svg className="w-4 h-4 text-brand-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
        </div>
      </section>
    </div>
  );
}
