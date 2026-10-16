import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Acceso from "./pages/Acceso.jsx";
import RecuperarPassword from "./pages/RecuperarPassword.jsx";
import NuevaPassword from "./pages/NuevaPassword.jsx";
import RutaPrivada from "./components/RutaPrivada.jsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.jsx";
import Resumen from "./pages/dashboard/Resumen.jsx";
import Alertas from "./pages/dashboard/Alertas.jsx";
import Inventario from "./pages/dashboard/Inventario.jsx";
import Productos from "./pages/dashboard/Productos.jsx";
import Documentacion from "./pages/dashboard/Documentacion.jsx";
import Proveedores from "./pages/dashboard/Proveedores.jsx";
import Ventas from "./pages/dashboard/Ventas.jsx";
import Balances from "./pages/dashboard/Balances.jsx";
import AvisoConfiguracion from "./components/AvisoConfiguracion.jsx";
import AvisoErrores from "./components/AvisoErrores.jsx";

export default function App() {
  return (
    <>
      <AvisoConfiguracion />
      <AvisoErrores />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Acceso />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />
        <Route path="/nueva-password" element={<NuevaPassword />} />
        <Route element={<RutaPrivada />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Resumen />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="productos" element={<Productos />} />
            <Route path="documentacion" element={<Documentacion />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="balances" element={<Balances />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
