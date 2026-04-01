export interface Profile {
  id: string;
  nombre: string;
  email: string;
  role: 'conductor' | 'admin';
  created_at: string;
}

export interface Cliente {
  id: string;
  numero_cliente: number;
  nombre_local: string;
  direccion: string | null;
  telefono: string | null;
  ruta_id: string | null;
  conductor_id: string;
  horario_atencion: string | null;
  notas: string | null;
  saldo_deuda: number;
  activo: boolean;
  proxima_visita: string | null;
  frecuencia_visita_dias: number;
  created_at: string;
  updated_at: string;
}

export interface Ruta {
  id: string;
  nombre: string;
  descripcion: string | null;
  conductor_id: string;
  dia_semana: number | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visita {
  id: string;
  cliente_id: string;
  conductor_id: string;
  ruta_id: string | null;
  fecha: string;
  unidades: number;
  precio_unitario: number;
  total: number;
  monto_efectivo: number;
  monto_transferencia: number;
  monto_deuda: number;
  observaciones: string | null;
  remito_generado: boolean;
  created_at: string;
}

export interface Remito {
  id: string;
  numero_remito: number;
  visita_id: string;
  cliente_id: string;
  conductor_id: string;
  fecha: string;
  total: number;
  estado: 'generado' | 'enviado' | 'facturado';
  factura_externa_id: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  numero_color: string;
  stock_deposito: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MovimientoStock {
  id: string;
  producto_id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: 'compra' | 'carga_auto' | 'devolucion' | 'ajuste';
  conductor_id: string | null;
  notas: string | null;
  created_at: string;
}

export interface RutaDiaria {
  id: string;
  ruta_id: string;
  conductor_id: string;
  cliente_id: string;
  fecha: string;
  visitado: boolean;
  orden: number;
  created_at: string;
}

export interface PagoDeuda {
  id: string;
  cliente_id: string;
  conductor_id: string;
  monto: number;
  metodo: 'efectivo' | 'transferencia';
  notas: string | null;
  created_at: string;
}

export interface Config {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

// Vistas
export interface FacturacionDiaria {
  conductor_id: string;
  fecha: string;
  total_visitas: number;
  total_unidades: number;
  total_facturado: number;
  total_efectivo: number;
  total_transferencia: number;
  total_deuda: number;
}

export interface StockBajo {
  id: string;
  nombre: string;
  numero_color: string;
  stock_deposito: number;
  stock_minimo: number;
}

export interface ProximaVisita {
  id: string;
  numero_cliente: number;
  nombre_local: string;
  telefono: string | null;
  direccion: string | null;
  proxima_visita: string;
  conductor_id: string;
  ruta_nombre: string | null;
}

// Tipos auxiliares
export type MetodoPago = 'efectivo' | 'transferencia' | 'deuda' | 'mixto';

export interface VisitaConCliente extends Visita {
  cliente: Pick<Cliente, 'numero_cliente' | 'nombre_local' | 'direccion' | 'telefono'>;
}

export interface RutaDiariaConCliente extends RutaDiaria {
  cliente: Pick<Cliente, 'numero_cliente' | 'nombre_local' | 'direccion' | 'telefono' | 'horario_atencion'>;
}
