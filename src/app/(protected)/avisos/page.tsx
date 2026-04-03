'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/lib/utils';
import { generarMensajeAvisoVisita, abrirWhatsApp } from '@/lib/whatsapp';
import type { ProximaVisita } from '@/types/database';

const IconPhone = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const IconCalendar = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function AvisosPage() {
  const supabase = useSupabase();
  const { profile, loading: userLoading } = useUser();
  const [proximas7, setProximas7] = useState<ProximaVisita[]>([]);
  const [proximas1, setProximas1] = useState<ProximaVisita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!profile) { setLoading(false); return; }

    async function load() {
      const hoy = new Date();
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      const en7dias = new Date(hoy);
      en7dias.setDate(en7dias.getDate() + 7);

      const mananStr = manana.toISOString().split('T')[0];
      const en7Str = en7dias.toISOString().split('T')[0];

      // Próximas 7 días
      const { data: data7 } = await supabase
        .from('v_proximas_visitas')
        .select('*')
        .eq('conductor_id', profile!.id)
        .gte('proxima_visita', mananStr)
        .lte('proxima_visita', en7Str);

      setProximas7(data7 || []);

      // Mañana
      const { data: data1 } = await supabase
        .from('v_proximas_visitas')
        .select('*')
        .eq('conductor_id', profile!.id)
        .eq('proxima_visita', mananStr);

      setProximas1(data1 || []);
      setLoading(false);
    }
    load();
  }, [supabase, profile, userLoading]);

  function getWhatsAppLink(cliente: ProximaVisita) {
    if (!cliente.telefono || !profile) return null;
    const mensaje = generarMensajeAvisoVisita({
      nombreLocal: cliente.nombre_local,
      fechaVisita: formatDate(cliente.proxima_visita),
      conductorNombre: profile.nombre,
    });
    return abrirWhatsApp(cliente.telefono, mensaje);
  }

  if (loading) return <p className="text-brand-muted text-center py-8">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Avisos WhatsApp</h2>

      {/* Mañana */}
      <div>
        <h3 className="section-title mb-3">
          <div className="flex items-center gap-2">
            <IconPhone />
            Visitas de mañana ({proximas1.length})
          </div>
        </h3>
        {proximas1.length > 0 ? (
          <div className="space-y-2">
            {proximas1.map((c) => {
              const link = getWhatsAppLink(c);
              return (
                <div key={c.id} className="card flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-brand-rose font-mono text-sm">#{c.numero_cliente}</span>
                      <span className="font-medium">{c.nombre_local}</span>
                    </div>
                    {c.ruta_nombre && (
                      <p className="text-xs text-brand-muted">Ruta: {c.ruta_nombre}</p>
                    )}
                  </div>
                  {link ? (
                    <a href={link} target="_blank" className="btn-primary text-sm">
                      Avisar
                    </a>
                  ) : (
                    <span className="text-xs text-brand-muted">Sin teléfono</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-brand-muted text-center py-4 card">No hay visitas para mañana</p>
        )}
      </div>

      {/* Próximos 7 días */}
      <div>
        <h3 className="section-title mb-3">
          <div className="flex items-center gap-2">
            <IconCalendar />
            Próximos 7 días ({proximas7.length})
          </div>
        </h3>
        {proximas7.length > 0 ? (
          <div className="space-y-2">
            {proximas7.map((c) => {
              const link = getWhatsAppLink(c);
              return (
                <div key={c.id} className="card flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-brand-rose font-mono text-sm">#{c.numero_cliente}</span>
                      <span className="font-medium">{c.nombre_local}</span>
                    </div>
                    <p className="text-xs text-brand-muted">
                      {formatDate(c.proxima_visita)}
                      {c.ruta_nombre && ` · ${c.ruta_nombre}`}
                    </p>
                  </div>
                  {link ? (
                    <a href={link} target="_blank" className="btn-secondary text-sm">
                      Avisar
                    </a>
                  ) : (
                    <span className="text-xs text-brand-muted">Sin tel.</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-brand-muted text-center py-4 card">No hay visitas programadas</p>
        )}
      </div>
    </div>
  );
}
