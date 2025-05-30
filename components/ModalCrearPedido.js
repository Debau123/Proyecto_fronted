"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function ModalCrearPedido({ open, onClose }) {
  const [reservasConfirmadas, setReservasConfirmadas] = useState([]); // Solo reservas con mesa asignada
  const [productos, setProductos] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  const [productosPedido, setProductosPedido] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      cargarReservasConfirmadas();
      cargarProductos();
    }
  }, [open]);

  const cargarReservasConfirmadas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservas?filters[mesa][id][$notNull]=true&populate=mesa,cliente`);
      const data = await res.json();
      if (data && data.data) {
        setReservasConfirmadas(data.data);
      } else {
        setReservasConfirmadas([]);
      }
    } catch (err) {
      console.error("Error cargando reservas confirmadas:", err);
      setReservasConfirmadas([]);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productos`);
      const data = await res.json();
      setProductos(data.data || []);
    } catch (err) {
      console.error("Error cargando productos:", err);
      setProductos([]);
    }
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
    if (!reservaSeleccionada || productosPedido.length === 0) {
      toast.error("Selecciona reserva y productos");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      toast.loading("Creando pedido...");
      const resPedido = await fetch(`${API_URL}/api/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          data: {
            reserva: reservaSeleccionada.id,
            estado: "pendiente",
            fecha: new Date().toISOString(),
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
              cantidad: item.cantidad,
            },
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
          <Select onValueChange={id => setReservaSeleccionada(reservasConfirmadas.find(r => r.id == id))}>
            <SelectTrigger disabled={loading}>
              <SelectValue placeholder="Selecciona reserva" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(reservasConfirmadas) && reservasConfirmadas.length > 0 ? (
                reservasConfirmadas.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.attributes.cliente?.data?.attributes?.username || "Cliente"} - Mesa {r.attributes.mesa?.data?.attributes?.numero || "N/A"}
                  </SelectItem>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-2">No hay reservas con mesa asignada</p>
              )}
            </SelectContent>
          </Select>

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
          <Button onClick={confirmarPedido} disabled={loading}>
            {loading ? "Creando pedido..." : "Confirmar"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
