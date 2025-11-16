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
    itemId: "",
    persona: "",
    prestado: 1,
    fechaVence: "",
    observacion: "",
};

function normalizeItem(raw) {
    return {
        id: raw.id || raw._id,
        descripcion: raw.descripcion || "",
    };
}

function normalizeLoan(raw, itemsMap) {
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

    const prestado = Number(raw.prestado ?? 0);
    const devuelto = Number(raw.devuelto ?? 0);
    const pendiente = Math.max(prestado - devuelto, 0);

    return {
        id: raw.id || raw._id,
        itemId,
        itemNombre,
        persona: raw.persona || "",
        prestado,
        devuelto,
        pendiente,
        fechaPrestamo: raw.fechaEntrega
            ? String(raw.fechaEntrega).slice(0, 10)
            : raw.createdAt
                ? String(raw.createdAt).slice(0, 10)
                : "",
        fechaVence: raw.fechaVence ? String(raw.fechaVence).slice(0, 10) : "",
        estado: raw.estado || (pendiente > 0 ? "EN_CURSO" : "COMPLETO"),
        observacion: raw.observacion || "",
    };
}

function estadoVariant(estado) {
    switch (estado) {
        case "COMPLETO":
            return "secondary";
        case "VENCIDO":
            return "danger";
        default:
            return "primary"; // EN_CURSO
    }
}

export default function Prestamos() {
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

            const [itemsResp, loansResp] = await Promise.all([
                api("/items"),
                api("/loans"),
            ]);

            const normalizedItems = itemsResp.map(normalizeItem);
            setItems(normalizedItems);

            const itemsMap = Object.fromEntries(
                normalizedItems.map((i) => [i.id, i])
            );

            const normalizedLoans = loansResp.map((l) =>
                normalizeLoan(l, itemsMap)
            );
            setRows(normalizedLoans);
        } catch (err) {
            setError(err.message || "Error al cargar préstamos.");
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
                r.estado.toLowerCase().includes(q)
        );
    }, [rows, filter]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setFlash(null);
    };

    const handleSelect = (row) => {
        setSelectedId(row.id);
        setFlash(null);
    };

    const ensureCanManage = () => {
        if (!canManage) {
            setFlash({
                type: "warning",
                msg: "Solo admin/encargado autenticados pueden registrar préstamos o devoluciones.",
            });
            return false;
        }
        return true;
    };

    const validateForm = () => {
        if (!form.itemId) return "Debes seleccionar un equipo.";
        if (!form.persona.trim())
            return "Debes indicar la persona que retira el equipo.";
        const prestado = Number(form.prestado);
        if (!prestado || prestado <= 0) {
            return "La cantidad prestada debe ser un número mayor a 0.";
        }
        if (!form.fechaVence) {
            return "Debes indicar la fecha de devolución comprometida.";
        }
        return null;
    };

    const toIsoEndOfDay = (dateStr) => {
        // "2025-12-31" -> "2025-12-31T23:59:59.000Z"
        return new Date(`${dateStr}T23:59:59.000Z`).toISOString();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFlash(null);

        if (!ensureCanManage()) return;

        const msg = validateForm();
        if (msg) {
            setFlash({ type: "danger", msg });
            return;
        }

        const payload = {
            item: form.itemId,
            persona: form.persona.trim(),
            prestado: Number(form.prestado) || 0,
            fechaVence: toIsoEndOfDay(form.fechaVence),
            observacion: form.observacion.trim(),
        };

        try {
            setSaving(true);
            // API solo tiene POST (crear), no PUT general
            await api("/loans", {
                method: "POST",
                body: payload,
            });
            setFlash({
                type: "success",
                msg: "Préstamo registrado correctamente.",
            });
            resetForm();
            await loadData();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo registrar el préstamo.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReturn = async (row) => {
        if (!ensureCanManage()) return;

        const max = row.pendiente || row.prestado;
        if (!max || max <= 0) {
            setFlash({
                type: "info",
                msg: "Este préstamo ya está completamente devuelto.",
            });
            return;
        }

        const input = window.prompt(
            `Cantidad devuelta (pendiente: ${max}):`,
            String(max)
        );
        if (!input) return;

        const cantidad = Number(input);
        if (!cantidad || cantidad <= 0) {
            alert("Debes ingresar una cantidad válida.");
            return;
        }

        try {
            setSaving(true);
            await api(`/loans/${row.id}/return`, {
                method: "PATCH",
                body: { cantidad },
            });
            setFlash({ type: "success", msg: "Devolución registrada." });
            await loadData();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo registrar la devolución.",
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
                msg: "Solo admin puede eliminar préstamos.",
            });
            return;
        }
        if (
            !window.confirm(
                "¿Eliminar el préstamo seleccionado? Esta acción es irreversible."
            )
        ) {
            return;
        }

        try {
            setSaving(true);
            await api(`/loans/${selectedId}`, { method: "DELETE" });
            setFlash({ type: "info", msg: "Préstamo eliminado." });
            setSelectedId(null);
            await loadData();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo eliminar el préstamo.",
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
                    Solo un <strong>admin/encargado autenticado</strong> puede registrar
                    préstamos o devoluciones.
                </Alert>
            )}

            <Form.Group className="mb-3" controlId="prestItem">
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

            <Form.Group className="mb-3" controlId="prestPersona">
                <Form.Label>Persona que retira *</Form.Label>
                <Form.Control
                    name="persona"
                    value={form.persona}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez / Sección X"
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="prestPrestado">
                <Form.Label>Cantidad prestada *</Form.Label>
                <Form.Control
                    type="number"
                    min={1}
                    name="prestado"
                    value={form.prestado}
                    onChange={handleChange}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="prestVence">
                <Form.Label>Fecha de devolución comprometida *</Form.Label>
                <Form.Control
                    type="date"
                    name="fechaVence"
                    value={form.fechaVence}
                    onChange={handleChange}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="prestObs">
                <Form.Label>Observaciones</Form.Label>
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
                    Registrar préstamo
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    disabled={saving}
                >
                    Limpiar
                </Button>
                <Button
                    type="button"
                    variant="outline-danger"
                    onClick={handleDelete}
                    disabled={!selectedId || saving}
                >
                    Eliminar préstamo
                </Button>
            </ButtonGroup>

            {selected && (
                <p className="mt-2 small text-muted">
                    Seleccionado: <strong>{selected.itemNombre}</strong> para{" "}
                    <strong>{selected.persona}</strong>
                </p>
            )}
        </Form>
    );

    const right = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
                <Form.Control
                    placeholder="Buscar por persona, equipo o estado..."
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
                    <span>Cargando préstamos...</span>
                </div>
            ) : (
                <Table hover responsive className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Fecha</th>
                            <th>Equipo</th>
                            <th>Persona</th>
                            <th className="text-end">Prestado</th>
                            <th className="text-end">Devuelto</th>
                            <th className="text-end">Pendiente</th>
                            <th>Vence</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                            <th>Obs.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="text-center text-muted py-4">
                                    No hay préstamos registrados.
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
                                    <td className="small">{r.fechaPrestamo}</td>
                                    <td>{r.itemNombre}</td>
                                    <td>{r.persona}</td>
                                    <td className="text-end">{r.prestado}</td>
                                    <td className="text-end">{r.devuelto}</td>
                                    <td className="text-end">{r.pendiente}</td>
                                    <td className="small">{r.fechaVence}</td>
                                    <td>
                                        <Badge bg={estadoVariant(r.estado)}>{r.estado}</Badge>
                                    </td>
                                    <td>
                                        <ButtonGroup size="sm">
                                            <Button
                                                variant="outline-success"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReturn(r);
                                                }}
                                                disabled={saving || r.pendiente <= 0}
                                            >
                                                Devolver
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
            leftTitle="Registrar / editar préstamo"
            rightTitle="Préstamos activos e históricos"
            left={left}
            right={right}
            leftMd={5}
            rightMd={7}
        />
    );
}
