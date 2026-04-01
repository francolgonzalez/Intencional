-- ============================================================
-- INTENCIONAL — Schema completo para Supabase
-- Ejecutar este SQL en el SQL Editor de Supabase
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PERFILES DE USUARIO (Franco y Augusto)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'conductor' CHECK (role IN ('conductor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- 2. CONFIGURACIÓN DEL SISTEMA
-- ============================================================
CREATE TABLE public.config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config lectura autenticados"
  ON public.config FOR SELECT
  USING (auth.role() = 'authenticated');

-- Valores iniciales de configuración
INSERT INTO public.config (key, value, description) VALUES
  ('precio_unitario', '2200', 'Precio base por esmalte en pesos'),
  ('whatsapp_webhook_url', '', 'URL del webhook de WhatsApp Business API (futuro)'),
  ('tusfacturas_api_key', '', 'API key de Tusfacturas para facturación electrónica (futuro)'),
  ('tusfacturas_api_url', 'https://app.tusfacturas.com.ar/api', 'URL base de Tusfacturas API'),
  ('dias_aviso_previo', '7', 'Días de anticipación para avisos de visita'),
  ('stock_minimo_alerta', '20', 'Cantidad mínima de stock para generar alerta');

-- ============================================================
-- 3. RUTAS
-- ============================================================
CREATE TABLE public.rutas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  conductor_id UUID NOT NULL REFERENCES public.profiles(id),
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes...
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conductores ven sus rutas"
  ON public.rutas FOR SELECT
  USING (auth.uid() = conductor_id);

CREATE POLICY "Conductores gestionan sus rutas"
  ON public.rutas FOR ALL
  USING (auth.uid() = conductor_id);

-- ============================================================
-- 4. CLIENTES
-- ============================================================
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_cliente INTEGER NOT NULL UNIQUE,
  nombre_local TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  ruta_id UUID REFERENCES public.rutas(id) ON DELETE SET NULL,
  conductor_id UUID NOT NULL REFERENCES public.profiles(id),
  horario_atencion TEXT,
  notas TEXT,
  saldo_deuda NUMERIC(12,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  proxima_visita DATE,
  frecuencia_visita_dias INTEGER DEFAULT 14,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_numero ON public.clientes(numero_cliente);
CREATE INDEX idx_clientes_conductor ON public.clientes(conductor_id);
CREATE INDEX idx_clientes_ruta ON public.clientes(ruta_id);
CREATE INDEX idx_clientes_proxima_visita ON public.clientes(proxima_visita);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conductores ven sus clientes"
  ON public.clientes FOR SELECT
  USING (auth.uid() = conductor_id);

CREATE POLICY "Conductores gestionan sus clientes"
  ON public.clientes FOR ALL
  USING (auth.uid() = conductor_id);

-- ============================================================
-- 5. VISITAS
-- ============================================================
CREATE TABLE public.visitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  conductor_id UUID NOT NULL REFERENCES public.profiles(id),
  ruta_id UUID REFERENCES public.rutas(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  unidades INTEGER NOT NULL DEFAULT 0,
  precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 2200,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_efectivo NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_transferencia NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_deuda NUMERIC(12,2) NOT NULL DEFAULT 0,
  observaciones TEXT,
  remito_generado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitas_conductor_fecha ON public.visitas(conductor_id, fecha);
CREATE INDEX idx_visitas_cliente ON public.visitas(cliente_id);
CREATE INDEX idx_visitas_fecha ON public.visitas(fecha);

ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conductores ven sus visitas"
  ON public.visitas FOR SELECT
  USING (auth.uid() = conductor_id);

CREATE POLICY "Conductores crean visitas"
  ON public.visitas FOR INSERT
  WITH CHECK (auth.uid() = conductor_id);

CREATE POLICY "Conductores actualizan sus visitas"
  ON public.visitas FOR UPDATE
  USING (auth.uid() = conductor_id);

-- ============================================================
-- 6. REMITOS
-- ============================================================
CREATE TABLE public.remitos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_remito SERIAL,
  visita_id UUID NOT NULL REFERENCES public.visitas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  conductor_id UUID NOT NULL REFERENCES public.profiles(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC(12,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'generado' CHECK (estado IN ('generado', 'enviado', 'facturado')),
  factura_externa_id TEXT, -- ID de Tusfacturas cuando se integre
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_remitos_conductor ON public.remitos(conductor_id);
CREATE INDEX idx_remitos_fecha ON public.remitos(fecha);

ALTER TABLE public.remitos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conductores ven sus remitos"
  ON public.remitos FOR SELECT
  USING (auth.uid() = conductor_id);

CREATE POLICY "Conductores crean remitos"
  ON public.remitos FOR INSERT
  WITH CHECK (auth.uid() = conductor_id);

-- ============================================================
-- 7. PRODUCTOS (Esmaltes por color)
-- ============================================================
CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  numero_color TEXT NOT NULL UNIQUE,
  stock_deposito INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 20,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productos_numero ON public.productos(numero_color);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura productos autenticados"
  ON public.productos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Gestión productos autenticados"
  ON public.productos FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 8. MOVIMIENTOS DE STOCK
-- ============================================================
CREATE TABLE public.movimientos_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  cantidad INTEGER NOT NULL,
  motivo TEXT NOT NULL CHECK (motivo IN ('compra', 'carga_auto', 'devolucion', 'ajuste')),
  conductor_id UUID REFERENCES public.profiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movimientos_producto ON public.movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_fecha ON public.movimientos_stock(created_at);

ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura movimientos autenticados"
  ON public.movimientos_stock FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Crear movimientos autenticados"
  ON public.movimientos_stock FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 9. PROGRESO DE RUTA DIARIA
-- ============================================================
CREATE TABLE public.ruta_diaria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruta_id UUID NOT NULL REFERENCES public.rutas(id),
  conductor_id UUID NOT NULL REFERENCES public.profiles(id),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  visitado BOOLEAN NOT NULL DEFAULT FALSE,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ruta_id, cliente_id, fecha)
);

CREATE INDEX idx_ruta_diaria_fecha ON public.ruta_diaria(fecha, conductor_id);

ALTER TABLE public.ruta_diaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conductores ven su ruta diaria"
  ON public.ruta_diaria FOR SELECT
  USING (auth.uid() = conductor_id);

CREATE POLICY "Conductores gestionan su ruta diaria"
  ON public.ruta_diaria FOR ALL
  USING (auth.uid() = conductor_id);

-- ============================================================
-- 10. PAGOS DE DEUDA
-- ============================================================
CREATE TABLE public.pagos_deuda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  conductor_id UUID NOT NULL REFERENCES public.profiles(id),
  monto NUMERIC(12,2) NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('efectivo', 'transferencia')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pagos_deuda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conductores ven pagos de sus clientes"
  ON public.pagos_deuda FOR SELECT
  USING (auth.uid() = conductor_id);

CREATE POLICY "Conductores registran pagos"
  ON public.pagos_deuda FOR INSERT
  WITH CHECK (auth.uid() = conductor_id);

-- ============================================================
-- 11. FUNCIONES Y TRIGGERS
-- ============================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_clientes_updated
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_productos_updated
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_rutas_updated
  BEFORE UPDATE ON public.rutas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_config_updated
  BEFORE UPDATE ON public.config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para actualizar stock al registrar movimiento
CREATE OR REPLACE FUNCTION actualizar_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.productos
    SET stock_deposito = stock_deposito + NEW.cantidad
    WHERE id = NEW.producto_id;
  ELSIF NEW.tipo = 'salida' THEN
    UPDATE public.productos
    SET stock_deposito = stock_deposito - NEW.cantidad
    WHERE id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_movimiento_stock
  AFTER INSERT ON public.movimientos_stock
  FOR EACH ROW EXECUTE FUNCTION actualizar_stock();

-- Función para actualizar saldo de deuda del cliente al crear visita
CREATE OR REPLACE FUNCTION actualizar_deuda_visita()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.monto_deuda > 0 THEN
    UPDATE public.clientes
    SET saldo_deuda = saldo_deuda + NEW.monto_deuda
    WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_visita_deuda
  AFTER INSERT ON public.visitas
  FOR EACH ROW EXECUTE FUNCTION actualizar_deuda_visita();

-- Función para reducir deuda al registrar pago
CREATE OR REPLACE FUNCTION reducir_deuda_pago()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clientes
  SET saldo_deuda = GREATEST(saldo_deuda - NEW.monto, 0)
  WHERE id = NEW.cliente_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_pago_deuda
  AFTER INSERT ON public.pagos_deuda
  FOR EACH ROW EXECUTE FUNCTION reducir_deuda_pago();

-- Función para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 12. VISTAS ÚTILES
-- ============================================================

-- Vista: facturación diaria por conductor
CREATE OR REPLACE VIEW public.v_facturacion_diaria AS
SELECT
  conductor_id,
  fecha,
  COUNT(*) as total_visitas,
  SUM(unidades) as total_unidades,
  SUM(total) as total_facturado,
  SUM(monto_efectivo) as total_efectivo,
  SUM(monto_transferencia) as total_transferencia,
  SUM(monto_deuda) as total_deuda
FROM public.visitas
GROUP BY conductor_id, fecha;

-- Vista: stock bajo
CREATE OR REPLACE VIEW public.v_stock_bajo AS
SELECT
  p.id,
  p.nombre,
  p.numero_color,
  p.stock_deposito,
  p.stock_minimo
FROM public.productos p
WHERE p.stock_deposito <= p.stock_minimo
  AND p.activo = TRUE;

-- Vista: clientes con próxima visita en los próximos 7 días
CREATE OR REPLACE VIEW public.v_proximas_visitas AS
SELECT
  c.id,
  c.numero_cliente,
  c.nombre_local,
  c.telefono,
  c.direccion,
  c.proxima_visita,
  c.conductor_id,
  r.nombre as ruta_nombre
FROM public.clientes c
LEFT JOIN public.rutas r ON c.ruta_id = r.id
WHERE c.proxima_visita IS NOT NULL
  AND c.proxima_visita BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND c.activo = TRUE
ORDER BY c.proxima_visita;
