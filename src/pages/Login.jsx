import React, { useState } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ usuario: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.usuario.trim() || !form.password) {
            setError("Ingresa usuario y contraseña.");
            return;
        }

        try {
            setLoading(true);
            await login(form.usuario.trim(), form.password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "No se pudo iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center py-5">
            <Card className="shadow border-0" style={{ maxWidth: 420, width: "100%" }}>
                <Card.Body className="p-4">
                    <h4 className="mb-3 fw-bold text-uppercase">Iniciar sesión</h4>
                    <p className="text-muted small">
                        Usa las credenciales configuradas en el sistema.
                    </p>

                    {error && (
                        <Alert
                            variant="danger"
                            onClose={() => setError(null)}
                            dismissible
                            className="py-2"
                        >
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="loginUsuario">
                            <Form.Label>Usuario *</Form.Label>
                            <Form.Control
                                name="usuario"
                                value={form.usuario}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="loginPassword">
                            <Form.Label>Contraseña *</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />
                        </Form.Group>

                        <div className="d-grid">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Ingresando..." : "Ingresar"}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
