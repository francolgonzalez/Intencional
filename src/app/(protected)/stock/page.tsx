'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useUser } from '@/hooks/useUser';
import type { Producto } from '@/types/database';

export default function StockPage() {
  const supabase = useSupabase();
  const { profile, loading: userLoading } = useUser();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ producto: Producto; tipo: 'entrada' | 'salida' } | null>(null);
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState<string>('compra');
  const [creando, setCreando] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', numero_color: '', stock_deposito: 0 });

  useEffect(() => {
    if (userLoading) return;
    loadProductos();
  }, [supabase, userLoading]);

  async function loadProductos() {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('numero_color');
    setProductos(data || []);
    setLoading(false);
  }

  async function registrarMovimiento() {
    if (!modal || !profile || cantidad <= 0) return;

    await supabase.from('movimientos_stock').insert({
      producto_id: modal.producto.id,
      tipo: modal.tipo,
      cantidad,
      motivo,
      conductor_id: profile.id,
    });

    setModal(null);
    setCantidad(0);
    loadProductos();
  }

  async function crearProducto(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('productos').insert({
      nombre: nuevoProducto.nombre,
      numero_color: nuevoProducto.numero_color,
      stock_deposito: nuevoProducto.stock_deposito,
    });
    setCreando(false);
    setNuevoProducto({ nombre: '', numero_color: '', stock_deposito: 0 });
    loadProductos();
  }

  const filtrados = productos.filter((p) => {
    const q = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || p.numero_color.toLowerCase().includes(q);
  });

  const stockBajo = productos.filter((p) => p.stock_deposito <= p.stock_minimo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Stock Depósito</h2>
        <button onClick={() => setCreando(!creando)} className="btn-primary text-sm">
          {creando ? 'Cancelar' : '+ Producto'}
        </button>
      </div>

      {/* Alertas de stock bajo */}
      {stockBajo.length > 0 && (
        <div className="card border-red-500/30 bg-red-500/5">
          <p className="text-red-400 font-medium text-sm mb-2">⚠️ Stock bajo ({stockBajo.length})</p>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map((p) => (
              <span key={p.id} className="badge-red">
                {p.numero_color}: {p.stock_deposito}
              </span>
            ))}
          </div>
        </div>
      )}

      {creando && (
        <form onSubmit={crearProducto} className="card space-y-3">
          <input
            value={nuevoProducto.nombre}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
            className="input w-full"
            placeholder="Nombre del color"
            required
          />
          <input
            value={nuevoProducto.numero_color}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, numero_color: e.target.value })}
            className="input w-full"
            placeholder="Número de color (ej: 001)"
            required
          />
          <input
            type="number"
            value={nuevoProducto.stock_deposito || ''}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock_deposito: parseInt(e.target.value) || 0 })}
            className="input w-full"
            placeholder="Stock inicial"
          />
          <button type="submit" className="btn-primary w-full">Crear producto</button>
        </form>
      )}

      <input
        type="text"
        placeholder="Buscar por nombre o número..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="input w-full"
      />

      {loading ? (
        <p className="text-brand-muted text-center py-8">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {filtrados.map((producto) => (
            <div key={producto.id} className={`card flex items-center justify-between ${
              producto.stock_deposito <= producto.stock_minimo ? 'border-red-500/30' : ''
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-rose font-mono text-sm">{producto.numero_color}</span>
                  <span className="font-medium">{producto.nombre}</span>
                </div>
                <p className={`text-sm mt-0.5 ${
                  producto.stock_deposito <= producto.stock_minimo ? 'text-red-400' : 'text-brand-muted'
                }`}>
                  Stock: {producto.stock_deposito}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setModal({ producto, tipo: 'entrada' }); setMotivo('compra'); }}
                  className="btn-ghost text-xs text-green-400"
                >
                  + Entrada
                </button>
                <button
                  onClick={() => { setModal({ producto, tipo: 'salida' }); setMotivo('carga_auto'); }}
                  className="btn-ghost text-xs text-yellow-400"
                >
                  − Salida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de movimiento */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setModal(null)} />
          <div className="card relative z-10 w-full max-w-sm space-y-4">
            <h3 className="font-bold">
              {modal.tipo === 'entrada' ? '📥 Entrada' : '📤 Salida'} — {modal.producto.nombre}
            </h3>
            <div>
              <label className="label">Cantidad</label>
              <input
                type="number"
                value={cantidad || ''}
                onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
                className="input w-full text-center text-lg"
                min="1"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Motivo</label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="input w-full"
              >
                {modal.tipo === 'entrada' ? (
                  <>
                    <option value="compra">Compra</option>
                    <option value="devolucion">Devolución</option>
                    <option value="ajuste">Ajuste</option>
                  </>
                ) : (
                  <>
                    <option value="carga_auto">Carga al auto</option>
                    <option value="ajuste">Ajuste</option>
                  </>
                )}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={registrarMovimiento} disabled={cantidad <= 0} className="btn-primary flex-1">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
