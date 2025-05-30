"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";

export default function ModalReceta({ open, onClose, receta }) {
  if (!receta) return null;

  const ingredientes = receta.attributes.receta_ingredientes?.data || [];
  const descripcion = receta.attributes.descripcion || "";
  const nombreProducto = receta.attributes.producto?.data?.attributes?.nombre || "Producto";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-lg shadow-lg p-6">
        {/* Título con nombre del producto */}
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">{nombreProducto}</DialogTitle>
        </DialogHeader>

        {/* Descripción de la receta */}
        <Separator className="my-4" />
        <div className="prose prose-sm max-w-none mb-4">
          <ReactMarkdown>{descripcion}</ReactMarkdown>
        </div>

        {/* Lista de ingredientes */}
        <Separator className="my-4" />
        <ScrollArea className="h-64">
          {ingredientes.length > 0 ? (
            <ul className="space-y-2">
              {ingredientes.map((ing) => {
                const ingredienteNombre = ing.attributes.ingrediente?.data?.attributes?.nombre || "Ingrediente";
                const cantidad = ing.attributes.cantidad_necesaria ?? "-";
                const unidad = ing.attributes.ingrediente?.data?.attributes?.unidad || ""; // Asegúrate de tener "unidad" en la colección Ingredientes
                return (
                  <li key={ing.id} className="flex justify-between items-center bg-gray-100 rounded p-2">
                    <span>{ingredienteNombre}</span>
                    <span className="text-sm text-gray-700">
                      {cantidad} {unidad}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-center text-sm text-gray-500">No hay ingredientes disponibles.</p>
          )}
        </ScrollArea>

        {/* Botón Cerrar */}
        <Separator className="my-4" />
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="hover:bg-gray-200">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
