// lib/withAdminOnly.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function withAdminOnly(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const [isAllowed, setIsAllowed] = useState(null); // null = cargando, true = acceso

    useEffect(() => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || user.rol !== "administrador") {
        router.replace("/"); // redirigir al inicio si no es admin
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
