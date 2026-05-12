import { Route } from "react-router-dom";
import { ProtectedRoute } from "../../../app/routes/ProtectedRoutes";
import HistorialReclamosferreteriaPage from "../pages/HistorialReclamosferreteriaPage";


export default [
    <Route key="historialReclamosferreteria" path="/historialReclamosferreteria" element={<HistorialReclamosferreteriaPage />} />,
    
];