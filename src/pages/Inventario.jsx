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
    descripcion: "",
    categoria: "",
    cantidad: 0,
    minimo: 0,
    critico: 0,
    responsable: "",
    observacion: "",
};

function computeEstado(row) {
    if (row.cantidad <= row.critico) return "CRITICO";
    if (row.cantidad <= row.minimo) return "BAJO";
    return "OK";
}

function estadoVariant(estado) {
    if (estado === "CRITICO") return "danger";
    if (estado === "BAJO") return "warning";
    return "success";
}

function normalizeItem(raw) {
    return {
        id: raw.id || raw._id,
        descripcion: raw.descripcion || "",
        categoria: raw.categoria || "General",
        cantidad: Number(raw.cantidad ?? 0),
        minimo: Number(raw.minimo ?? 0),
        critico: Number(raw.critico ?? 0),
        responsable: raw.responsable || "Bodega",
        observacion: raw.observacion || "",
    };
}

export default function Inventario() {
    const { api, token } = useApi();
    const { isAuthenticated, user } = useAuth();

    const canManage =
        isAuthenticated && (user?.rol === "admin" || user?.rol === "encargado");
    const canDelete = isAuthenticated && user?.rol === "admin";

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [filter, setFilter] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api("/items");
            setRows(data.map(normalizeItem));
        } catch (err) {
            setError(err.message || "Error al cargar el inventario.");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const selected = rows.find((r) => r.id === selectedId) || null;

    const filteredRows = useMemo(() => {
        if (!filter.trim()) return rows;
        const q = filter.toLowerCase();
        return rows.filter(
            (r) =>
                r.descripcion.toLowerCase().includes(q) ||
                (r.categoria || "").toLowerCase().includes(q) ||
                (r.responsable || "").toLowerCase().includes(q)
        );
    }, [rows, filter]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSelect = (row) => {
        setSelectedId(row.id);
        setForm({
            descripcion: row.descripcion,
            categoria: row.categoria,
            cantidad: row.cantidad,
            minimo: row.minimo,
            critico: row.critico,
            responsable: row.responsable,
            observacion: row.observacion,
        });
        setFlash(null);
    };

    const resetForm = () => {
        setSelectedId(null);
        setForm(emptyForm);
        setFlash(null);
    };

    const validateForm = () => {
        if (!form.descripcion.trim()) {
            return "La descripción es obligatoria.";
        }
        const cantidad = Number(form.cantidad);
        const minimo = Number(form.minimo);
        const critico = Number(form.critico);

        if (Number.isNaN(cantidad) || cantidad < 0) {
            return "La cantidad debe ser un número mayor o igual a 0.";
        }
        if (Number.isNaN(minimo) || minimo < 0) {
            return "El mínimo debe ser un número mayor o igual a 0.";
        }
        if (Number.isNaN(critico) || critico < 0) {
            return "El crítico debe ser un número mayor o igual a 0.";
        }
        return null;
    };

    const ensureCanManage = () => {
        if (!canManage) {
            setFlash({
                type: "warning",
                msg: "Solo admin/encargado autenticados pueden crear o editar ítems.",
            });
            return false;
        }
        return true;
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
            descripcion: form.descripcion.trim(),
            categoria: form.categoria.trim() || "General",
            cantidad: Number(form.cantidad) || 0,
            minimo: Number(form.minimo) || 0,
            critico: Number(form.critico) || 0,
            responsable: form.responsable.trim() || "Bodega",
            observacion: form.observacion.trim(),
        };

        try {
            setSaving(true);
            if (selectedId) {
                await api(`/items/${selectedId}`, {
                    method: "PUT",
                    body: payload,
                });
                setFlash({ type: "success", msg: "Ítem actualizado correctamente." });
            } else {
                await api("/items", {
                    method: "POST",
                    body: payload,
                });
                setFlash({ type: "success", msg: "Ítem creado correctamente." });
            }
            resetForm();
            await loadItems();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo guardar el ítem.",
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
                msg: "Solo admin puede eliminar ítems.",
            });
            return;
        }
        if (
            !window.confirm(
                "¿Eliminar el ítem seleccionado? Esta acción es irreversible."
            )
        ) {
            return;
        }

        try {
            setSaving(true);
            await api(`/items/${selectedId}`, { method: "DELETE" });
            setFlash({ type: "info", msg: "Ítem eliminado." });
            resetForm();
            await loadItems();
        } catch (err) {
            setFlash({
                type: "danger",
                msg: err.message || "No se pudo eliminar el ítem.",
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
                    Puedes ver el inventario sin iniciar sesión, pero solo un{" "}
                    <strong>admin/encargado</strong> puede crear o editar ítems.
                </Alert>
            )}

            <Form.Group className="mb-3" controlId="invDescripcion">
                <Form.Label>Descripción *</Form.Label>
                <Form.Control
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    placeholder="Ej: Multímetro digital"
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="invCategoria">
                <Form.Label>Categoría</Form.Label>
                <Form.Control
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    placeholder="Ej: Laboratorio"
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="invCantidad">
                <Form.Label>Cantidad *</Form.Label>
                <Form.Control
                    type="number"
                    min={0}
                    name="cantidad"
                    value={form.cantidad}
                    onChange={handleChange}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="invMinimos">
                <Form.Label>Mínimo / Crítico *</Form.Label>
                <div className="d-flex gap-2">
                    <Form.Control
                        type="number"
                        min={0}
                        name="minimo"
                        value={form.minimo}
                        onChange={handleChange}
                        placeholder="Mínimo"
                        required
                    />
                    <Form.Control
                        type="number"
                        min={0}
                        name="critico"
                        value={form.critico}
                        onChange={handleChange}
                        placeholder="Crítico"
                        required
                    />
                </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="invResponsable">
                <Form.Label>Responsable</Form.Label>
                <Form.Control
                    name="responsable"
                    value={form.responsable}
                    onChange={handleChange}
                    placeholder="Ej: Bodega"
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="invObs">
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
                    {selectedId ? "Actualizar" : "Crear"} ítem
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
                    Editando: <strong>{selected.descripcion}</strong>
                </p>
            )}
        </Form>
    );

    const right = (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
                <Form.Control
                    placeholder="Buscar por descripción, categoría o responsable..."
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
                    <span>Cargando inventario...</span>
                </div>
            ) : (
                <Table hover responsive className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th className="text-end">Cantidad</th>
                            <th>Estado</th>
                            <th>Responsable</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted py-4">
                                    No hay ítems registrados.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((r, idx) => {
                                const estado = computeEstado(r);
                                return (
                                    <tr
                                        key={r.id}
                                        onClick={() => handleSelect(r)}
                                        style={{ cursor: "pointer" }}
                                        className={selectedId === r.id ? "table-active" : ""}
                                    >
                                        <td>{idx + 1}</td>
                                        <td>{r.descripcion}</td>
                                        <td>{r.categoria}</td>
                                        <td className="text-end">{r.cantidad}</td>
                                        <td>
                                            <Badge bg={estadoVariant(estado)}>{estado}</Badge>
                                        </td>
                                        <td>{r.responsable}</td>
                                        <td className="small text-muted">{r.observacion}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            )}
        </>
    );

    return (
        <FormTableShell
            leftTitle="Formulario de inventario"
            rightTitle="Inventario"
            left={left}
            right={right}
            leftMd={5}
            rightMd={7}
        />
    );
}
