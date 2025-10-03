import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import './app.css';
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Solicitudes from "./pages/Solicitudes";
import Usuarios from "./pages/Usuarios";
import Inventario from "./pages/Inventario";
import Prestamos from "./pages/Prestamos";

const Placeholder = ({ title }) => <h1 className="h5 mb-0">{title}</h1>;

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "solicitudes", element: <Solicitudes /> },
      { path: "inventario", element: <Inventario /> },
      { path: "prestamos", element: <Prestamos /> },
      { path: "trazabilidad", element: <Placeholder title="Trazabilidad" /> },
      { path: "reportes", element: <Placeholder title="Reportes" /> },
      { path: "usuarios", element: <Usuarios /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
