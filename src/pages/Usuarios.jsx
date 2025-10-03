import { useMemo, useState } from "react";
import { Form, Button, ButtonGroup, Table, Badge, Alert } from "react-bootstrap";
import FormTableShell from "../components/FormTableShell";

const ROLES = [
    { value: "admin", label: "Administrador" },
    { value: "encargado", label: "Encargado" },
    { value: "invitado", label: "Invitado" },
];

const initialUsers = [
    {
        id: 1,
        nombre: "Administrador",
        usuario: "admin",
        email: "admin@local",
        rol: "admin",
        activo: true,
        ultimoAcceso: new Date(),
    },
];

export default function Usuarios() {
    const [rows, setRows] = useState(initialUsers);
    const [selectedId, setSelectedId] = useState(null);

    const emptyForm = useMemo(
        () => ({
            nombre: "",
            usuario: "",
            email: "",
            rol: "encargado",
            activo: "si", // manejamos como "si"/"no" para que calce con select
            password: "",
        }),
        []
    );
    const [form, setForm] = useState(emptyForm);
    const [flash, setFlash] = useState(null); // {type:'success'|'danger'|'info', msg:''}

    const isEditing = selectedId !== null;

    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const resetFlash = () => setFlash(null);

    const usernameExists = (u, excludeId = null) =>
        rows.some((x) => x.usuario.trim().toLowerCase() === u.trim().toLowerCase() && x.id !== excludeId);

    const handleSelect = (id) => {
        const u = rows.find((x) => x.id === id);
        if (!u) return;
        setSelectedId(id);
        setForm({
            nombre: u.nombre,
            usuario: u.usuario,
            email: u.email || "",
            rol: u.rol,
            activo: u.activo ? "si" : "no",
            password: "",
        });
        resetFlash();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        resetFlash();

        if (!form.nombre.trim() || !form.usuario.trim()) {
            setFlash({ type: "danger", msg: "Nombre y Usuario son obligatorios." });
            return;
        }
        if (usernameExists(form.usuario, isEditing ? selectedId : null)) {
            setFlash({ type: "danger", msg: "El usuario ya existe. Elige otro." });
            return;
        }

        if (isEditing) {
            setRows((prev) =>
                prev.map((x) =>
                    x.id === selectedId
                        ? {
                            ...x,
                            nombre: form.nombre.trim(),
                            usuario: form.usuario.trim(),
                            email: form.email.trim(),
                            rol: form.rol,
                            activo: form.activo === "si",
                            // password: ignorado en demo (no se guarda)
                        }
                        : x
                )
            );
            setFlash({ type: "success", msg: "Usuario actualizado." });
        } else {
            const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
            setRows((prev) => [
                ...prev,
                {
                    id: nextId,
                    nombre: form.nombre.trim(),
                    usuario: form.usuario.trim(),
                    email: form.email.trim(),
                    rol: form.rol,
                    activo: form.activo === "si",
                    ultimoAcceso: null,
                },
            ]);
            setFlash({ type: "success", msg: "Usuario creado." });
        }

        setSelectedId(null);
        setForm(emptyForm);
    };

    const handleCancel = () => {
        resetFlash();
        setSelectedId(null);
        setForm(emptyForm);
    };

    const handleDelete = () => {
        if (!isEditing) return;
        setRows((prev) => prev.filter((x) => x.id !== selectedId));
        setSelectedId(null);
        setForm(emptyForm);
        setFlash({ type: "info", msg: "Usuario eliminado." });
    };

    const handleResetPassword = () => {
        if (!isEditing) return;
        const temp = `temporal-${Math.random().toString(36).slice(2, 8)}`;
        setFlash({ type: "warning", msg: `Contraseña temporal: ${temp}` });
    };

    const roleLabel = (v) => ROLES.find((r) => r.value === v)?.label ?? v;

    const left = (
        <Form onSubmit={handleSubmit}>
            {flash && (
                <Alert
                    variant={flash.type}
                    className="rounded-pill py-2 px-3 mb-3"
                    onClose={resetFlash}
                    dismissible
                >
                    {flash.msg}
                </Alert>
            )}

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Nombre:</Form.Label>
                <Form.Control
                    className="rounded-pill"
                    placeholder="Nombre completo"
                    value={form.nombre}
                    onChange={(e) => setField("nombre", e.target.value)}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Usuario:</Form.Label>
                <Form.Control
                    className="rounded-pill"
                    placeholder="p. ej. admin"
                    value={form.usuario}
                    onChange={(e) => setField("usuario", e.target.value)}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Email (opcional):</Form.Label>
                <Form.Control
                    type="email"
                    className="rounded-pill"
                    placeholder="admin@local"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Rol:</Form.Label>
                <Form.Select
                    className="rounded-pill"
                    value={form.rol}
                    onChange={(e) => setField("rol", e.target.value)}
                >
                    {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                            {r.label}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Activo:</Form.Label>
                <Form.Select
                    className="rounded-pill"
                    value={form.activo}
                    onChange={(e) => setField("activo", e.target.value)}
                >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Nueva contraseña:</Form.Label>
                <Form.Control
                    type="password"
                    className="rounded-pill"
                    placeholder="(opcional)"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                />
            </Form.Group>

            <div className="d-grid gap-2 mb-2">
                <Button
                    type="submit"
                    className="rounded-pill"
                    style={{
                        backgroundColor: "var(--c-dark-1)",
                        borderColor: "var(--c-dark-1)",
                        paddingTop: "var(--btn-pad-y)",
                        paddingBottom: "var(--btn-pad-y)",
                    }}
                >
                    {isEditing ? "Guardar" : "Crear"}
                </Button>
            </div>

            <div className="d-flex justify-content-between text-uppercase small mb-3">
                <Button variant="link" className="text-decoration-none" disabled={!isEditing}>
                    Editar
                </Button>
                <Button variant="link" className="text-decoration-none" onClick={handleCancel}>
                    Cancelar
                </Button>
            </div>

            <div className="d-grid gap-2">
                <Button
                    className="rounded-pill"
                    style={{ backgroundColor: "var(--danger-900)", borderColor: "var(--danger-900)" }}
                    onClick={handleDelete}
                    disabled={!isEditing}
                >
                    Dar de baja
                </Button>

                <Button
                    variant="light"
                    className="rounded-pill"
                    onClick={handleResetPassword}
                    disabled={!isEditing}
                >
                    Resetear contraseña
                </Button>
            </div>
        </Form>
    );

    const right = (
        <Table hover responsive className="align-middle">
            <thead>
                <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Activo</th>
                    <th>Último acceso</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r, idx) => (
                    <tr
                        key={r.id}
                        onClick={() => handleSelect(r.id)}
                        style={{
                            cursor: "pointer",
                            background: selectedId === r.id ? "var(--brand-100)" : "transparent",
                        }}
                    >
                        <td>{idx + 1}</td>
                        <td>{r.nombre}</td>
                        <td>{r.usuario}</td>
                        <td>{roleLabel(r.rol)}</td>
                        <td>
                            <Badge bg={r.activo ? "success" : "secondary"}>
                                {r.activo ? "Sí" : "No"}
                            </Badge>
                        </td>
                        <td>
                            {r.ultimoAcceso
                                ? new Date(r.ultimoAcceso).toLocaleString("es-CL")
                                : "—"}
                        </td>
                    </tr>
                ))}
                {rows.length === 0 && (
                    <tr>
                        <td colSpan={6} className="text-center text-muted">
                            Sin usuarios.
                        </td>
                    </tr>
                )}
            </tbody>
        </Table>
    );

    return (
        <FormTableShell
            leftTitle="Formulario"
            rightTitle="Listado"
            left={left}
            right={right}
            leftMd={5}
            rightMd={7}
        />
    );
}
