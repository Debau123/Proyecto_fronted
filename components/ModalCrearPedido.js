"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function ModalCrearPedido({ open, onClose }) {
  const [mesasConReserva, setMesasConReserva] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  const [productosPedido, setProductosPedido] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      cargarMesasConReserva();
      cargarProductos();
    }
  }, [open]);

  const cargarMesasConReserva = async () => {
    const res = await fetch(`${API_URL}/api/mesas?populate[reserva][populate]=cliente`);
    const data = await res.json();
    const mesas = data.data.filter(m => m.attributes.reserva?.data !== null);
    setMesasConReserva(mesas);
  };

  const cargarProductos = async () => {
    const res = await fetch(`${API_URL}/api/productos`);
    const data = await res.json();
    setProductos(data.data);
  };

  const agregarProducto = () => {
    if (!productoSeleccionado || cantidadSeleccionada < 1) {
      toast.error("Selecciona un producto y una cantidad válida");
      return;
    }
    const existe = productosPedido.find(p => p.productoId === productoSeleccionado);
    if (existe) {
      setProductosPedido(prev =>
        prev.map(p =>
          p.productoId === productoSeleccionado ? { ...p, cantidad: p.cantidad + cantidadSeleccionada } : p
        )
      );
    } else {
      setProductosPedido(prev => [...prev, { productoId: productoSeleccionado, cantidad: cantidadSeleccionada }]);
    }
    toast.success("Producto añadido al pedido");
  };

  const confirmarPedido = async () => {
    if (!mesaSeleccionada || productosPedido.length === 0) {
      toast.error("Selecciona mesa y productos");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const reservaId = mesaSeleccionada.attributes.reserva.data.id;

    try {
      toast.loading("Creando pedido...");
      const resPedido = await fetch(`${API_URL}/api/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          data: {
            reserva: reservaId,
            estado: "pendiente",
            fecha: new Date().toISOString()
          }
        }),
      });
      const pedidoData = await resPedido.json();
      const pedidoId = pedidoData.data.id;

      for (const item of productosPedido) {
        await fetch(`${API_URL}/api/pedido-productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            data: {
              pedido: pedidoId,
              producto: item.productoId,
              cantidad: item.cantidad
            }
          }),
        });

        const resProducto = await fetch(`${API_URL}/api/productos/${item.productoId}?populate=receta.receta_ingredientes.ingrediente`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const productoData = await resProducto.json();
        const recetaIngredientes = productoData.data.attributes.receta?.data?.attributes?.receta_ingredientes?.data || [];

        for (const recetaIng of recetaIngredientes) {
          const ingrediente = recetaIng.attributes.ingrediente.data;
          const idIngrediente = ingrediente.id;
          const stockActual = ingrediente.attributes.stock_actual;
          const cantidadNecesaria = recetaIng.attributes.cantidad_necesaria;
          const cantidadTotal = cantidadNecesaria * item.cantidad;
          const nuevoStock = stockActual - cantidadTotal;

          await fetch(`${API_URL}/api/ingredientes/${idIngrediente}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ data: { stock_actual: nuevoStock } }),
          });
        }
      }

      toast.dismiss();
      toast.success("Pedido creado y stock actualizado");
      onClose();
    } catch (err) {
      console.error("Error:", err);
      toast.dismiss();
      toast.error("Error al crear pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mesa */}
          <Select onValueChange={id => setMesaSeleccionada(mesasConReserva.find(m => m.id == id))}>
            <SelectTrigger disabled={loading}>
              <SelectValue placeholder="Selecciona mesa" />
            </SelectTrigger>
            <SelectContent>
              {mesasConReserva.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  Mesa {m.attributes.numero} - {m.attributes.reserva.data.attributes.cliente.data.attributes.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Producto */}
          <Select onValueChange={id => setProductoSeleccionado(id)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona producto" />
            </SelectTrigger>
            <SelectContent>
              {productos.map(prod => (
                <SelectItem key={prod.id} value={prod.id}>
                  {prod.attributes.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Cantidad"
            min="1"
            value={cantidadSeleccionada}
            disabled={!productoSeleccionado || loading}
            onChange={e => setCantidadSeleccionada(parseInt(e.target.value))}
          />
          <Button onClick={agregarProducto} disabled={!productoSeleccionado || loading}>Agregar al pedido</Button>

          {/* Lista de productos añadidos */}
          {productosPedido.length > 0 && (
            <div>
              <h3>Productos añadidos:</h3>
              <ul>
                {productosPedido.map(p => {
                  const producto = productos.find(prod => prod.id === p.productoId);
                  return (
                    <li key={p.productoId}>
                      {producto?.attributes?.nombre} x {p.cantidad}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={confirmarPedido} disabled={loading}>{loading ? "Creando pedido..." : "Confirmar"}</Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
