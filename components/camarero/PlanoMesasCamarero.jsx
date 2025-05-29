import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { API_URL } from "@/lib/api"; // ✅ Usamos la constante API_URL

export default function PlanoMesasCamarero({ mesas }) {
  const canvasRef = useRef(null);
  const mesasRef = useRef([]);
  const contadorIdRef = useRef(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState({ abierto: false, mesa: null });
  const [nuevaMesa, setNuevaMesa] = useState({ pax: 2, tipo: "cuadrada" });
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [seleccionada, setSeleccionada] = useState(null);

  useEffect(() => {
    if (mesas && mesas.length) {
      mesasRef.current = mesas.map((item) => {
        const m = item.attributes;
        return {
          id: item.id,
          numero: m.numero,
          x: m.posicion_x != null ? parseFloat(m.posicion_x) : 100,
          y: m.posicion_y != null ? parseFloat(m.posicion_y) : 100,
          pax: m.capacidad ?? 2,
          rotacion: m.rotacion ?? 0,
          tipo: (m.tipo || "cuadrada").toLowerCase(),
          reservada: m.reservada,
          reserva: m.reserva?.data,
        };
      });
      contadorIdRef.current = Math.max(...mesasRef.current.map((m) => m.numero || 0), 0) + 1;
      draw();
    }
  }, [mesas]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    mesasRef.current.forEach((m) => {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate((m.rotacion * Math.PI) / 180);
      ctx.fillStyle = m.reservada
        ? "lightgreen"
        : (seleccionada?.id === m.id ? "orange" : "lightblue");

      if (m.tipo === "cuadrada") ctx.fillRect(-30, -30, 60, 60);
      else if (m.tipo === "redonda") {
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "black";
      ctx.font = "14px Arial";
      ctx.fillText(`Mesa ${m.numero}`, -25, -10);
      ctx.fillText(`${m.pax} pax`, -20, 10);
      ctx.restore();
    });
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mesaClicada = mesasRef.current.find(
      (m) => Math.abs(m.x - x) < 40 && Math.abs(m.y - y) < 40
    );

    if (mesaClicada) {
      if (seleccionada && seleccionada.id === mesaClicada.id) {
        // 🚩 Abrimos modal de confirmación
        setModalConfirmacion({ abierto: true, mesa: mesaClicada });
      } else {
        setSeleccionada(mesaClicada);
        draw();
      }
    } else {
      setSeleccionada(null);
      draw();
    }
  };

  const eliminarMesa = async () => {
    const mesa = modalConfirmacion.mesa;
    if (!mesa) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/mesas/${mesa.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      mesasRef.current = mesasRef.current.filter((m) => m.id !== mesa.id);
      setSeleccionada(null);
      draw();
      toast.success("Mesa eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar mesa:", error);
      toast.error("Error al eliminar mesa");
    } finally {
      setModalConfirmacion({ abierto: false, mesa: null });
    }
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const mesa = mesasRef.current.find((m) => Math.abs(m.x - x) < 40 && Math.abs(m.y - y) < 40);
    if (mesa) {
      setDragging(mesa);
      setOffset({ x: x - mesa.x, y: y - mesa.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;
    dragging.x = x;
    dragging.y = y;
    draw();
  };

  const handleMouseUp = async () => {
    if (dragging) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/mesas/${dragging.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            data: {
              posicion_x: dragging.x,
              posicion_y: dragging.y,
              rotacion: dragging.rotacion ?? 0,
            },
          }),
        });
        toast.success(`Mesa ${dragging.numero} guardada automáticamente`);
      } catch (err) {
        console.error("Error al guardar posición automáticamente:", err);
        toast.error("Error al guardar posición");
      }
      setDragging(null);
    }
  };

  const handleCrearMesa = async () => {
    const nueva = {
      numero: contadorIdRef.current,
      tipo: nuevaMesa.tipo?.toLowerCase(),
      capacidad: nuevaMesa.pax,
      posicion_x: 100,
      posicion_y: 100,
      rotacion: 0,
      reservada: false,
      fusionada: false,
      grupo_fusion: "",
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/mesas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: nueva }),
      });
      const json = await res.json();
      if (!json.data || !json.data.id) throw new Error(json.error?.message || "Error al crear mesa");
      mesasRef.current.push({
        id: json.data.id,
        numero: nueva.numero,
        x: nueva.posicion_x,
        y: nueva.posicion_y,
        pax: nueva.capacidad,
        rotacion: nueva.rotacion,
        tipo: nueva.tipo,
        reservada: false,
        reserva: null,
      });
      contadorIdRef.current++;
      draw();
      setModalAbierto(false);
      toast.success("Mesa creada correctamente");
    } catch (error) {
      console.error("Error al crear mesa:", error);
      toast.error("Error al crear mesa");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="border-4 border-gray-700 bg-white rounded"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      ></canvas>
      <div className="mt-4 flex gap-4">
        <button onClick={() => setModalAbierto(true)} className="px-4 py-2 bg-green-500 text-white rounded">Añadir Mesa</button>
      </div>

      {modalAbierto && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-xl font-bold mb-4">Nueva Mesa</h2>
            <label className="block mb-2">
              Capacidad:
              <input type="number" value={nuevaMesa.pax} min={1} className="w-full border p-2 rounded mt-1"
                onChange={(e) => setNuevaMesa({ ...nuevaMesa, pax: parseInt(e.target.value) })} />
            </label>
            <label className="block mb-4">
              Tipo:
              <select value={nuevaMesa.tipo} className="w-full border p-2 rounded mt-1"
                onChange={(e) => setNuevaMesa({ ...nuevaMesa, tipo: e.target.value })}>
                <option value="cuadrada">Cuadrada</option>
                <option value="redonda">Redonda</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalAbierto(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
              <button onClick={handleCrearMesa} className="px-4 py-2 bg-green-600 text-white rounded">Crear</button>
            </div>
          </div>
        </div>
      )}

      {modalConfirmacion.abierto && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-xl font-bold mb-4">Confirmar eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar la mesa {modalConfirmacion.mesa?.numero}?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalConfirmacion({ abierto: false, mesa: null })}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarMesa}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
