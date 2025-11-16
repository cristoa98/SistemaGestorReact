import React from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { isAuthenticated, user } = useAuth();

    return (
        <div>
            <h4 className="mb-3">Bienvenido al Gestor Local</h4>
            <p className="text-muted">
                Administra inventario, solicitudes, préstamos y usuarios desde un solo
                lugar.
            </p>

            {!isAuthenticated && (
                <Alert variant="info">
                    Para crear, editar o eliminar registros debes{" "}
                    <strong>iniciar sesión</strong>. Sin sesión solo puedes visualizar.
                </Alert>
            )}

            {isAuthenticated && (
                <Alert variant="success">
                    Sesión iniciada como <strong>{user?.nombre}</strong> ({user?.rol}).
                </Alert>
            )}
        </div>
    );
}
