// src/pages/Requests.jsx
import { useMemo, useState } from "react";
import { Form, Button, ButtonGroup, Table, Badge } from "react-bootstrap";
import FormTableShell from "../components/FormTableShell";

const TIPOS = [
    { value: "", label: "Seleccione..." },
    { value: "prestamo", label: "Préstamo" },
    { value: "devolucion", label: "Devolución" },
    { value: "baja", label: "Baja" },
];
const PERSONAS = [
    { value: "", label: "Seleccione..." },
    { value: "Juan Pérez", label: "Juan Pérez" },
    { value: "Prof. Díaz", label: "Prof. Díaz" },
    { value: "María Soto", label: "María Soto" },
];
const ESTADOS = {
    CREADA: "CREADA",
    APROBADA: "APROBADA",
    RECHAZADA: "RECHAZADA",
    PRESTAMO_EMITIDO: "PRÉSTAMO EMITIDO",
    BAJA: "BAJA",
};
const initialRows = [
    { id: 1, descripcion: "Multímetro", tipo: "prestamo", cantidad: 1, persona: "Juan Pérez", observacion: "Uso en clase", estado: ESTADOS.CREADA },
    { id: 2, descripcion: "Set de cables", tipo: "prestamo", cantidad: 3, persona: "Prof. Díaz", observacion: "Laboratorio", estado: ESTADOS.CREADA },
];

export default function Solicitudes() {
    const [rows, setRows] = useState(initialRows);
    const [selectedId, setSelectedId] = useState(null);
    const emptyForm = useMemo(() => ({ descripcion: "", tipo: "", cantidad: 1, observacion: "", persona: "" }), []);
    const [form, setForm] = useState(emptyForm);
    const isEditing = selectedId !== null;

    const badgeVariant = (estado) => {
        if (estado === ESTADOS.CREADA) return "warning";
        if (estado === ESTADOS.APROBADA) return "success";
        if (estado === ESTADOS.RECHAZADA) return "danger";
        if (estado === ESTADOS.PRESTAMO_EMITIDO) return "primary";
        if (estado === ESTADOS.BAJA) return "secondary";
        return "light";
    };

    const handleSelect = (id) => {
        const r = rows.find((x) => x.id === id);
        if (!r) return;
        setSelectedId(id);
        setForm({ descripcion: r.descripcion, tipo: r.tipo, cantidad: r.cantidad, observacion: r.observacion, persona: r.persona });
    };
    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.tipo || !form.descripcion.trim() || !form.persona || !form.cantidad) return;

        if (isEditing) {
            setRows((p) => p.map((x) => (x.id === selectedId ? { ...x, ...form } : x)));
        } else {
            const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
            setRows((p) => [...p, { id: nextId, ...form, estado: ESTADOS.CREADA }]);
        }
        setSelectedId(null);
        setForm(emptyForm);
    };
    const handleCancel = () => { setSelectedId(null); setForm(emptyForm); };
    const setEstado = (nuevo) => selectedId && setRows((p) => p.map((x) => (x.id === selectedId ? { ...x, estado: nuevo } : x)));
    const handleDelete = () => { if (!selectedId) return; setRows((p) => p.filter((x) => x.id !== selectedId)); handleCancel(); };

    const selectedRow = rows.find((r) => r.id === selectedId) || null;
    const canTransitionFromCreada = selectedRow && selectedRow.estado === ESTADOS.CREADA;
    const canEmitirPrestamo = selectedRow && (selectedRow.estado === ESTADOS.CREADA || selectedRow.estado === ESTADOS.APROBADA);

    // ------- Left (form) -------
    const left = (
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Tipo Solicitud:</Form.Label>
                <Form.Select className="rounded-pill" value={form.tipo} onChange={(e) => setField("tipo", e.target.value)}>
                    {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Descripción:</Form.Label>
                <Form.Control className="rounded-pill" placeholder="Ingrese descripción" value={form.descripcion}
                    onChange={(e) => setField("descripcion", e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Cantidad:</Form.Label>
                <Form.Control type="number" min={1} className="rounded-pill" value={form.cantidad}
                    onChange={(e) => setField("cantidad", Number(e.target.value))} />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Observación:</Form.Label>
                <Form.Control className="rounded-pill" placeholder="Opcional" value={form.observacion}
                    onChange={(e) => setField("observacion", e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Persona:</Form.Label>
                <Form.Select className="rounded-pill" value={form.persona} onChange={(e) => setField("persona", e.target.value)}>
                    {PERSONAS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2 mb-2">
                <Button type="submit" className="rounded-pill"
                    style={{ backgroundColor: "var(--c-dark-1)", borderColor: "var(--c-dark-1)", paddingTop: "var(--btn-pad-y)", paddingBottom: "var(--btn-pad-y)" }}>
                    {isEditing ? "Guardar" : "Crear"}
                </Button>
            </div>

            <div className="d-flex justify-content-between text-uppercase small mb-3">
                <Button variant="link" className="text-decoration-none" disabled={!isEditing}>Editar</Button>
                <Button variant="link" className="text-decoration-none" onClick={handleCancel}>Cancelar</Button>
            </div>

            <div className="d-grid gap-2">
                <Button className="rounded-pill" style={{ backgroundColor: "var(--danger-900)", borderColor: "var(--danger-900)" }}
                    onClick={handleDelete} disabled={!isEditing}>
                    Dar de baja
                </Button>

                <ButtonGroup className="w-100">
                    <Button variant="light" className="rounded-pill flex-fill" onClick={() => setEstado(ESTADOS.APROBADA)} disabled={!canTransitionFromCreada}>Aprobar</Button>
                    <Button variant="light" className="rounded-pill flex-fill" onClick={() => setEstado(ESTADOS.RECHAZADA)} disabled={!canTransitionFromCreada}>Rechazar</Button>
                    <Button variant="light" className="rounded-pill flex-fill" onClick={() => setEstado(ESTADOS.PRESTAMO_EMITIDO)} disabled={!canEmitirPrestamo}>Emitir préstamo</Button>
                </ButtonGroup>
            </div>
        </Form>
    );

    // ------- Right (table) -------
    const right = (
        <Table hover responsive className="align-middle">
            <thead>
                <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Descripción</th>
                    <th>Solicitud</th>
                    <th style={{ width: 110 }}>Cantidad</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Observación</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r, idx) => (
                    <tr key={r.id} onClick={() => handleSelect(r.id)} style={{ cursor: "pointer", background: selectedId === r.id ? "var(--brand-100)" : "transparent" }}>
                        <td>{idx + 1}</td>
                        <td>{r.descripcion}</td>
                        <td>{TIPOS.find((t) => t.value === r.tipo)?.label ?? "-"}</td>
                        <td>{r.cantidad}</td>
                        <td>{r.persona}</td>
                        <td><Badge bg={badgeVariant(r.estado)} className="text-uppercase">{r.estado}</Badge></td>
                        <td>{r.observacion}</td>
                    </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted">Sin datos.</td></tr>}
            </tbody>
        </Table>
    );

    return <FormTableShell leftTitle="Formulario" rightTitle="Listado" left={left} right={right} leftMd={5} rightMd={7} />;
}
