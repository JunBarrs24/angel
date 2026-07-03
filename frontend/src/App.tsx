// Enrutado principal de la app.

import { Navigate, Route, Routes } from "react-router-dom";

import { useChild } from "./hooks/useChild";
import { MapScreen } from "./screens/MapScreen";
import { Onboarding } from "./screens/Onboarding";
import { ProgressScreen } from "./screens/ProgressScreen";
import { StoreScreen } from "./screens/StoreScreen";
import { DayScreen } from "./screens/day/DayScreen";

export default function App() {
  const { childId } = useChild();

  return (
    <Routes>
      <Route
        path="/"
        element={childId != null ? <Navigate to="/mapa" replace /> : <Onboarding />}
      />
      <Route path="/mapa" element={<MapScreen />} />
      <Route path="/dia/:dayNumber" element={<DayScreen />} />
      <Route path="/progreso" element={<ProgressScreen />} />
      <Route path="/tienda" element={<StoreScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
