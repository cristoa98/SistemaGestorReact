import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Inventario from "./pages/Inventario";
import Solicitudes from "./pages/Solicitudes";
import Prestamos from "./pages/Prestamos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="solicitudes" element={<Solicitudes />} />
            <Route path="prestamos" element={<Prestamos />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>

          <Route path="/login" element={<Login />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
