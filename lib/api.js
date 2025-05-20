export const API_URL = "http://localhost:1340";
 export async function getResumenAdmin() {
  const hoy = new Date().toISOString().split("T")[0];

  const [reservas, pedidos, ingredientes, pedidosTotales] = await Promise.all([
    fetch(`/api/reservas?filters[fecha][$eq]=${hoy}`).then(res => res.json()),
    fetch(`/api/pedidos?filters[estado][$eq]=activo`).then(res => res.json()),
    fetch(`/api/ingredientes?filters[stock][$lt]=10`).then(res => res.json()),
    fetch(`/api/pedidos?populate[platos][fields][0]=precio`).then(res => res.json()),
  ]);

  const ingresosHoy = pedidosTotales.data.reduce((total, pedido) => {
    const fechaPedido = pedido.attributes.fecha?.split("T")[0];
    if (fechaPedido === hoy) {
      const platos = pedido.attributes.platos?.data || [];
      const suma = platos.reduce((acc, plato) => acc + plato.attributes.precio, 0);
      return total + suma;
    }
    return total;
  }, 0);

  return {
    reservasHoy: reservas.data.length,
    pedidosActivos: pedidos.data.length,
    ingredientesCriticos: ingredientes.data.length,
    ingresosHoy: ingresosHoy,
  };
}
