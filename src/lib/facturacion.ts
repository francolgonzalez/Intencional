/**
 * Módulo de Facturación — Integración Tusfacturas
 *
 * Estado actual: estructura preparada, sin implementación activa.
 * Para activar: configurar tusfacturas_api_key y tusfacturas_api_url
 * en la tabla config de Supabase.
 */

import type { Visita, Cliente, Profile } from '@/types/database';

interface DatosRemito {
  visita: Visita;
  cliente: Cliente;
  conductor: Profile;
}

interface RemitoGenerado {
  numero: string;
  fecha: string;
  cliente: {
    nombre: string;
    direccion: string;
    numero: number;
  };
  conductor: string;
  items: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  total: number;
  metodoPago: string;
}

export function generarDatosRemito({ visita, cliente, conductor }: DatosRemito): RemitoGenerado {
  const metodos: string[] = [];
  if (visita.monto_efectivo > 0) metodos.push(`Efectivo: $${visita.monto_efectivo.toLocaleString('es-AR')}`);
  if (visita.monto_transferencia > 0) metodos.push(`Transferencia: $${visita.monto_transferencia.toLocaleString('es-AR')}`);
  if (visita.monto_deuda > 0) metodos.push(`Deuda: $${visita.monto_deuda.toLocaleString('es-AR')}`);

  return {
    numero: '', // Se asigna al guardar en DB (SERIAL)
    fecha: visita.fecha,
    cliente: {
      nombre: cliente.nombre_local,
      direccion: cliente.direccion || '',
      numero: cliente.numero_cliente,
    },
    conductor: conductor.nombre,
    items: [{
      descripcion: 'Esmaltes Intencional',
      cantidad: visita.unidades,
      precioUnitario: visita.precio_unitario,
      subtotal: visita.total,
    }],
    total: visita.total,
    metodoPago: metodos.join(' | '),
  };
}

/**
 * INTEGRACIÓN FUTURA: Tusfacturas API
 *
 * Para activar:
 * 1. Obtener API key en tusfacturas.com.ar
 * 2. Guardar en config: tusfacturas_api_key
 * 3. Descomentar la función emitirFactura
 *
 * Documentación: https://www.tusfacturas.com.ar/api-factura-electronica-afip.html
 *
 * async function emitirFactura(datos: RemitoGenerado): Promise<{ ok: boolean; facturaId?: string; error?: string }> {
 *   const apiKey = await getConfig('tusfacturas_api_key');
 *   const apiUrl = await getConfig('tusfacturas_api_url');
 *
 *   if (!apiKey || !apiUrl) {
 *     return { ok: false, error: 'API key o URL no configuradas' };
 *   }
 *
 *   const body = {
 *     apikey: apiKey,
 *     apitoken: apiKey,
 *     usertoken: apiKey,
 *     comprobante: {
 *       fecha: datos.fecha,
 *       tipo: 'FACTURA B',
 *       operacion: 'V',
 *       punto_venta: 1,
 *       moneda: 'PES',
 *       cotizacion: 1,
 *       detalle: datos.items.map(item => ({
 *         cantidad: item.cantidad,
 *         producto: { descripcion: item.descripcion },
 *         precio_unitario_sin_iva: item.precioUnitario,
 *       })),
 *       cliente: {
 *         documento_tipo: 'DNI',
 *         razon_social: datos.cliente.nombre,
 *         domicilio: datos.cliente.direccion,
 *       }
 *     }
 *   };
 *
 *   const response = await fetch(`${apiUrl}/v2/facturacion/nuevo`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(body)
 *   });
 *
 *   const result = await response.json();
 *
 *   if (result.error === 'N') {
 *     return { ok: true, facturaId: result.comprobante_nro };
 *   }
 *
 *   return { ok: false, error: result.errores?.join(', ') || 'Error desconocido' };
 * }
 */
