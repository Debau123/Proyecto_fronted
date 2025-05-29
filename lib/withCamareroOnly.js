// lib/withCamareroOnly.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function withCamareroOnly(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const [isAllowed, setIsAllowed] = useState(null); // null = cargando, true = acceso

    useEffect(() => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || user.rol !== "camarero") {
        router.replace("/"); // redirigir al inicio si no es camarero
      } else {
        setIsAllowed(true); // acceso permitido
      }
    }, []);

    if (isAllowed === null) {
      return <div className="pt-28 px-6">Cargando...</div>; // loading temporal
    }

    return <Component {...props} />;
  };
}
