/**
 * Módulo de WhatsApp
 *
 * Actualmente: genera URLs para abrir WhatsApp Web/App con mensaje pre-cargado.
 * Futuro: integración con WhatsApp Business API via webhook.
 */

import { generateWhatsAppUrl } from './utils';

interface MensajeVisita {
  nombreLocal: string;
  fechaVisita: string;
  conductorNombre: string;
}

export function generarMensajeAvisoVisita({ nombreLocal, fechaVisita, conductorNombre }: MensajeVisita): string {
  return `¡Hola! 👋 Soy ${conductorNombre} de *Intencional*.\n\nTe aviso que voy a pasar por *${nombreLocal}* el día *${fechaVisita}*.\n\n¿Necesitás que te lleve algo en particular?\n\n¡Gracias! 💅`;
}

export function generarMensajeRemito(
  nombreLocal: string,
  unidades: number,
  total: number,
  conductorNombre: string
): string {
  return `¡Hola! Soy ${conductorNombre} de *Intencional*.\n\nTe dejo el detalle de tu pedido:\n📦 ${unidades} unidades\n💰 Total: $${total.toLocaleString('es-AR')}\n\n¡Gracias por tu compra! 💅`;
}

export function abrirWhatsApp(telefono: string, mensaje: string): string {
  return generateWhatsAppUrl(telefono, mensaje);
}

/**
 * INTEGRACIÓN FUTURA: WhatsApp Business API
 *
 * Para activar:
 * 1. Configurar webhook_url en la tabla config de Supabase
 * 2. Descomentar y adaptar la función enviarMensajeAPI
 *
 * async function enviarMensajeAPI(telefono: string, mensaje: string): Promise<boolean> {
 *   const webhookUrl = await getConfig('whatsapp_webhook_url');
 *   if (!webhookUrl) return false;
 *
 *   const response = await fetch(webhookUrl, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       messaging_product: 'whatsapp',
 *       to: telefono,
 *       type: 'text',
 *       text: { body: mensaje }
 *     })
 *   });
 *
 *   return response.ok;
 * }
 */
