import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Form,
    Button,
    Table,
    Badge,
    ButtonGroup,
    Alert,
    Spinner,
} from "react-bootstrap";
import FormTableShell from "../components/FormTableShell";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
    nombre: "",
    usuario: "",
    email: "",
    rol: "invitado",
    activo: true,
    password: "",
};

function normalizeUser(raw) {
    return {
        id: raw.id || raw._id,
        nombre: raw.nombre || "",
        usuario: raw.usuario || "",
        email: raw.email || "",
        rol: raw.rol || "invitado",
        activo: raw.activo ?? true,
    };
}

export default function Usuarios() {
    const { api } = useApi();
    const { user, token, isAuthenticated } = useAuth();

    const isAdmin = isAuthenticated && user?.rol === "admin";

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [filter, setFilter] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api("/users");
            setRows(data.map(normalizeUser));
        } catch (err) {
            setError(err.message || "Error al cargar usuarios.");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        } else {
            setLoading(false);
        }
    }, [isAdmin, loadUsers]);

    const filteredRows = useMemo(() => {
        if (!filter.trim()) return rows;
        const q = filter.toLowerCase();
        return rows.filter(
            (r) =>
                r.nombre.toLowerCase().includes(q) ||
                r.usuario.toLowerCase().includes(q) ||
                r.rol.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q)
        );
    }, [rows, filter]);

    const selected = rows.find((r) => r.id === selectedId) || null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const resetForm = () => {
        setSelectedId(null);
        setForm(emptyForm);
        setFlash(null);
    };

    const handleSelect = (row) => {
        setSelectedId(row.id);
        setForm({
            nombre: row.nombre,
            usuario: row.usuario,
            email: row.email,
            rol: row.rol,
            activo: row.activo,
            password: "",
        });
        setFlash(null);
    };

    const ensureAdmin = () => {
        if (!token || !isAdmin) {
            setFlash({
                type: "warning",
                msg: "Solo usuarios administradores autenticados pueden gestionar usuarios.",
            });
            return false;
        }
        return true;
    };

    const validateCreate = () => {
        if (!form.nombre.trim()) return "El nombre es obligatorio.";
        if (!form.usuario.trim()) return "El usuario es obligatorio.";
        if (!form.email.trim()) return "El email es obligatorio.";
        if (!form.password.trim()) return "La contraseña es obligatoria.";
        return null;
    };

    const validateUpdate = () => {
        if (!form.nombre.trim()) return "El nombre es obligatorio.";
        if (!form.email.trim()) return "El email es obligatorio.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFlash(null);

        if (!ensureAdmin()) return;

        const validate = selectedId ? validateUpdate : validateCreate;
        const msg = validate();
        if (msg) {
            setFlash({ type: "danger", msg });
            return;
        }

        try {
            setSaving(true);
            if (selectedId) {
                const payload = {
                    nombre: form.nombre.trim(),
                    email: form.email.trim(),
                    rol: form.rol,
                    activo: form.activo,
                };
                if (form.password.trim()) {
                    payload.password = form.password.trim();
                }
                await api(`/users/${selectedId}`, {
                    method: "PUT",
                    body: payload,
                });
                setFlash({
                    type: "success",
                    msg: "Usuario actualizado correctamente.",
                });
            } else {
                const payload = {
                    nombre: form.nombre.trim(),
                    usuario: form.usuario.trim(),
                    email: form.email.trim(),
                    password: form.password.trim(),
                    rol: form.rol,
                    activo: form.activo,
                };
                await api("/users", {
                    method: "POST",
                    body: payload,
                });
                setFlash({
                    type: "success",
                    msg: "Usuario creado correctamente.",
                });
            }
            resetForm();
            await loadUsers();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo guardar el usuario.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (!ensureAdmin()) return;

        if (selected && selected.usuario === user?.usuario) {
            setFlash({
                type: "warning",
                msg: "No puedes eliminar tu propio usuario mientras estás conectado.",
            });
            return;
        }

        if (
            !window.confirm(
                "¿Eliminar el usuario seleccionado? Esta acción es irreversible."
            )
        ) {
            return;
        }

        try {
            setSaving(true);
            await api(`/users/${selectedId}`, { method: "DELETE" });
            setFlash({ type: "info", msg: "Usuario eliminado." });
            resetForm();
            await loadUsers();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo eliminar el usuario.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="py-4">
                {loading ? (
                    <div className="d-flex justify-content-center py-4">
                        <Spinner
                            animation="border"
                            role="status"
                            size="sm"
                            className="me-2"
                        />
                        <span>Verificando permisos...</span>
                    </div>
                ) : (
                    <Alert variant="danger">
                        Acceso restringido. Esta sección solo está disponible para
                        administradores.
                    </Alert>
                )}
            </div>
        );
    }

    const left = (
        <Form onSubmit={handleSubmit}>
            {flash && (
                <Alert
                    variant={flash.type}
                    onClose={() => setFlash(null)}
                    dismissible
                    className="py-2"
                >
                    {flash.msg}
                </Alert>
            )}

            <Form.Group className="mb-3" controlId="userNombre">
                <Form.Label>Nombre completo *</Form.Label>
                <Form.Control
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Ana Pérez"
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="userUsuario">
                <Form.Label>
                    Usuario *{" "}
                    {selectedId && (
                        <span className="text-muted small">(no editable)</span>
                    )}
                </Form.Label>
                <Form.Control
                    name="usuario"
                    value={form.usuario}
                    onChange={handleChange}
                    placeholder="Ej: aperez"
                    disabled={Boolean(selectedId)}
                    required={!selectedId}
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="userEmail">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Ej: ana@example.com"
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="userRol">
                <Form.Label>Rol *</Form.Label>
                <Form.Select name="rol" value={form.rol} onChange={handleChange}>
                    <option value="invitado">Invitado</option>
                    <option value="encargado">Encargado</option>
                    <option value="admin">Administrador</option>
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="userActivo">
                <Form.Check
                    type="checkbox"
                    label="Usuario activo"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="userPassword">
                <Form.Label>
                    Contraseña{" "}
                    {selectedId ? (
                        <span className="text-muted small">
                            (deja en blanco para mantener la actual)
                        </span>
                    ) : (
                        "*"
                    )}
                </Form.Label>
                <Form.Control
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required={!selectedId}
                />
            </Form.Group>

            <ButtonGroup className="d-flex gap-2">
                <Button type="submit" disabled={saving}>
                    {selectedId ? "Actualizar" : "Crear"} usuario
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    disabled={saving}
                >
                    Nuevo
                </Button>
                <Button
                    type="button"
                    variant="outline-danger"
                    onClick={handleDelete}
                    disabled={!selectedId || saving}
                >
                    Eliminar
                </Button>
            </ButtonGroup>

            {selected && (
                <p className="mt-2 small text-muted">
                    Editando usuario: <strong>{selected.usuario}</strong>
                </p>
            )}
        </Form>
    );

    const right = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
                <Form.Control
                    placeholder="Buscar por nombre, usuario, rol o email..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

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

            {loading ? (
                <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" role="status" size="sm" className="me-2" />
                    <span>Cargando usuarios...</span>
                </div>
            ) : (
                <Table hover responsive className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-muted py-4">
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((r, idx) => (
                                <tr
                                    key={r.id}
                                    onClick={() => handleSelect(r)}
                                    style={{ cursor: "pointer" }}
                                    className={selectedId === r.id ? "table-active" : ""}
                                >
                                    <td>{idx + 1}</td>
                                    <td>{r.nombre}</td>
                                    <td>{r.usuario}</td>
                                    <td>{r.email}</td>
                                    <td>
                                        <Badge
                                            bg={
                                                r.rol === "admin"
                                                    ? "dark"
                                                    : r.rol === "encargado"
                                                        ? "primary"
                                                        : "secondary"
                                            }
                                        >
                                            {r.rol}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={r.activo ? "success" : "secondary"}>
                                            {r.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            )}
        </>
    );

    return (
        <FormTableShell
            leftTitle="Gestión de usuarios"
            rightTitle="Usuarios registrados"
            left={left}
            right={right}
            leftMd={5}
            rightMd={7}
        />
    );
}
