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
    tipo: "prestamo",
    persona: "",
    email: "",
    itemId: "",
    cantidad: 1,
    fechaUso: "",
    observacion: "",
};

function normalizeItem(raw) {
    return {
        id: raw.id || raw._id,
        descripcion: raw.descripcion || "",
    };
}

function estadoVariant(estado) {
    switch ((estado || "").toLowerCase()) {
        case "aprobada":
            return "success";
        case "rechazada":
            return "danger";
        case "completa":
            return "secondary";
        default:
            return "warning"; // pendiente u otro
    }
}

function normalizeRequest(raw, itemsMap) {
    const itemField = raw.item;
    let itemId = null;
    let itemNombre = "No especificado";

    if (typeof itemField === "string") {
        itemId = itemField;
        if (itemsMap[itemId]) itemNombre = itemsMap[itemId].descripcion;
    } else if (itemField) {
        itemId = itemField.id || itemField._id;
        itemNombre = itemField.descripcion || itemNombre;
    }

    return {
        id: raw.id || raw._id,
        tipo: raw.tipo || "prestamo",
        persona: raw.persona || "",
        itemId,
        itemNombre,
        cantidad: Number(raw.cantidad ?? 0) || 0,
        estado: raw.estado || "pendiente",
        observacion: raw.observacion || "",
        creado: raw.createdAt ? String(raw.createdAt).slice(0, 10) : "",
    };
}

export default function Solicitudes() {
    const { api, token } = useApi();
    const { isAuthenticated, user } = useAuth();

    const canManage =
        isAuthenticated && (user?.rol === "admin" || user?.rol === "encargado");
    const canDelete = isAuthenticated && user?.rol === "admin";

    const [items, setItems] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [filter, setFilter] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [itemsResp, reqsResp] = await Promise.all([
                api("/items"),
                api("/requests"),
            ]);

            const normalizedItems = itemsResp.map(normalizeItem);
            setItems(normalizedItems);

            const itemsMap = Object.fromEntries(
                normalizedItems.map((i) => [i.id, i])
            );

            const normalizedReqs = reqsResp.map((r) =>
                normalizeRequest(r, itemsMap)
            );
            setRows(normalizedReqs);
        } catch (err) {
            setError(err.message || "Error al cargar solicitudes.");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const selected = rows.find((r) => r.id === selectedId) || null;

    const filteredRows = useMemo(() => {
        if (!filter.trim()) return rows;
        const q = filter.toLowerCase();
        return rows.filter(
            (r) =>
                r.persona.toLowerCase().includes(q) ||
                r.itemNombre.toLowerCase().includes(q) ||
                r.estado.toLowerCase().includes(q) ||
                r.tipo.toLowerCase().includes(q)
        );
    }, [rows, filter]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const resetForm = () => {
        setSelectedId(null);
        setForm(emptyForm);
        setFlash(null);
    };

    const handleSelect = (row) => {
        setSelectedId(row.id);
        setForm((f) => ({
            ...f,
            tipo: row.tipo || "prestamo",
            persona: row.persona,
            itemId: row.itemId || "",
            cantidad: row.cantidad,
            observacion: row.observacion,
        }));
        setFlash(null);
    };

    const validateForm = () => {
        if (!form.tipo) return "El tipo de solicitud es obligatorio.";
        if (!form.persona.trim()) return "La persona solicitante es obligatoria.";
        if (!form.itemId) return "Debes seleccionar un equipo.";
        const cantidad = Number(form.cantidad);
        if (!cantidad || cantidad <= 0) {
            return "La cantidad debe ser un número mayor a 0.";
        }
        return null;
    };

    const ensureCanManage = () => {
        if (!canManage) {
            setFlash({
                type: "warning",
                msg: "Solo admin/encargado autenticados pueden crear o actualizar solicitudes.",
            });
            return false;
        }
        return true;
    };

    const buildObservacion = () => {
        let parts = [];
        if (form.email.trim()) parts.push(`email: ${form.email.trim()}`);
        if (form.fechaUso) parts.push(`fechaUso: ${form.fechaUso}`);
        if (form.observacion.trim()) parts.push(form.observacion.trim());
        return parts.join(" | ");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFlash(null);

        const msg = validateForm();
        if (msg) {
            setFlash({ type: "danger", msg });
            return;
        }

        if (!ensureCanManage()) return;

        const payload = {
            tipo: form.tipo, // "prestamo" | "devolucion" | "baja"
            persona: form.persona.trim(),
            item: form.itemId,
            cantidad: Number(form.cantidad) || 0,
            observacion: buildObservacion(),
        };

        try {
            setSaving(true);
            // API solo tiene POST + PATCH status, no PUT general
            await api("/requests", {
                method: "POST",
                body: payload,
            });
            setFlash({
                type: "success",
                msg: "Solicitud creada correctamente.",
            });

            resetForm();
            await loadData();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo guardar la solicitud.",
            });
        } finally {
            setSaving(false);
        }
    };

    const updateEstado = async (row, nuevoEstado) => {
        if (!ensureCanManage()) return;
        try {
            setSaving(true);
            await api(`/requests/${row.id}/status`, {
                method: "PATCH",
                body: { estado: nuevoEstado }, // pendiente|aprobada|rechazada|completa
            });
            setFlash({
                type: "success",
                msg: `Estado actualizado a ${nuevoEstado}.`,
            });
            await loadData();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo actualizar el estado.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (!canDelete) {
            setFlash({
                type: "warning",
                msg: "Solo admin puede eliminar solicitudes.",
            });
            return;
        }

        if (
            !window.confirm(
                "¿Eliminar la solicitud seleccionada? Esta acción es irreversible."
            )
        ) {
            return;
        }

        try {
            setSaving(true);
            await api(`/requests/${selectedId}`, { method: "DELETE" });
            setFlash({ type: "info", msg: "Solicitud eliminada." });
            resetForm();
            await loadData();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo eliminar la solicitud.",
            });
        } finally {
            setSaving(false);
        }
    };

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

            {!canManage && (
                <Alert variant="info" className="py-2">
                    Solo un <strong>admin/encargado autenticado</strong> puede crear
                    solicitudes.
                </Alert>
            )}

            <Form.Group className="mb-3" controlId="solTipo">
                <Form.Label>Tipo de solicitud *</Form.Label>
                <Form.Select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    required
                >
                    <option value="prestamo">Préstamo</option>
                    <option value="devolucion">Devolución</option>
                    <option value="baja">Baja / retiro definitivo</option>
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="solPersona">
                <Form.Label>Nombre solicitante *</Form.Label>
                <Form.Control
                    name="persona"
                    value={form.persona}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="solEmail">
                <Form.Label>Correo de contacto</Form.Label>
                <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Ej: juan@ejemplo.cl"
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="solItem">
                <Form.Label>Equipo / recurso *</Form.Label>
                <Form.Select
                    name="itemId"
                    value={form.itemId}
                    onChange={handleChange}
                    required
                >
                    <option value="">Selecciona un equipo...</option>
                    {items.map((i) => (
                        <option key={i.id} value={i.id}>
                            {i.descripcion}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="solCantidad">
                <Form.Label>Cantidad *</Form.Label>
                <Form.Control
                    type="number"
                    min={1}
                    name="cantidad"
                    value={form.cantidad}
                    onChange={handleChange}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="solFecha">
                <Form.Label>Fecha de uso</Form.Label>
                <Form.Control
                    type="date"
                    name="fechaUso"
                    value={form.fechaUso}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="solObs">
                <Form.Label>Detalle / observaciones</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={2}
                    name="observacion"
                    value={form.observacion}
                    onChange={handleChange}
                />
            </Form.Group>

            <ButtonGroup className="d-flex gap-2">
                <Button type="submit" disabled={saving}>
                    Enviar solicitud
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    disabled={saving}
                >
                    Nueva
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
                    Seleccionada: <strong>{selected.persona}</strong> ({selected.itemNombre})
                </p>
            )}
        </Form>
    );

    const right = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
                <Form.Control
                    placeholder="Buscar por nombre, equipo, tipo o estado..."
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
                    <span>Cargando solicitudes...</span>
                </div>
            ) : (
                <Table hover responsive className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Persona</th>
                            <th>Equipo</th>
                            <th className="text-end">Cant.</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center text-muted py-4">
                                    No hay solicitudes registradas.
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
                                    <td className="small">{r.creado}</td>
                                    <td className="text-capitalize">{r.tipo}</td>
                                    <td>{r.persona}</td>
                                    <td>{r.itemNombre}</td>
                                    <td className="text-end">{r.cantidad}</td>
                                    <td>
                                        <Badge bg={estadoVariant(r.estado)}>
                                            {String(r.estado || "").toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td>
                                        <ButtonGroup size="sm">
                                            <Button
                                                variant="outline-success"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateEstado(r, "aprobada");
                                                }}
                                                disabled={saving}
                                            >
                                                Aprobar
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateEstado(r, "rechazada");
                                                }}
                                                disabled={saving}
                                            >
                                                Rechazar
                                            </Button>
                                        </ButtonGroup>
                                    </td>
                                    <td className="small text-muted">{r.observacion}</td>
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
            leftTitle="Nueva solicitud"
            rightTitle="Solicitudes registradas"
            left={left}
            right={right}
            leftMd={5}
            rightMd={7}
        />
    );
}
