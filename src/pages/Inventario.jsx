// src/pages/Inventory.jsx
import { useMemo, useState } from "react";
import {
    Form, Button, Table, Badge, ButtonGroup, Modal, Alert
} from "react-bootstrap";
import FormTableShell from "../components/FormTableShell";

const initialItems = [
    { id: 1, descripcion: "Multímetro", categoria: "Laboratorio", cantidad: 5, responsable: "Bodega", observacion: "Equipos verificados" },
    { id: 2, descripcion: "Set de cables", categoria: "General", cantidad: 20, responsable: "Bodega", observacion: "Reposición reciente" },
];

export default function Inventario() {
    // datos
    const [rows, setRows] = useState(initialItems);
    const [selectedId, setSelectedId] = useState(null);

    // umbrales globales
    const [thresholds, setThresholds] = useState({ bajo: 3, critico: 1 });
    const [showUmbral, setShowUmbral] = useState(false);

    // form
    const emptyForm = useMemo(() => ({
        descripcion: "", categoria: "", cantidad: 0, responsable: "Bodega", observacion: ""
    }), []);
    const [form, setForm] = useState(emptyForm);
    const isEditing = selectedId !== null;

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // helpers
    const stockLevel = (cant) => {
        if (cant <= thresholds.critico) return "CRÍTICO";
        if (cant <= thresholds.bajo) return "BAJO";
        return "OK";
    };
    const badgeFor = (lvl) => {
        if (lvl === "OK") return <Badge bg="success">OK</Badge>;
        if (lvl === "BAJO") return <Badge bg="warning">BAJO</Badge>;
        return <Badge bg="danger">CRÍTICO</Badge>;
    };

    // acciones
    const handleSelect = (id) => {
        const r = rows.find(x => x.id === id);
        if (!r) return;
        setSelectedId(id);
        setForm({
            descripcion: r.descripcion, categoria: r.categoria, cantidad: r.cantidad,
            responsable: r.responsable, observacion: r.observacion
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.descripcion.trim()) return;

        if (isEditing) {
            setRows(p => p.map(x => x.id === selectedId ? { ...x, ...form } : x));
        } else {
            const nextId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
            setRows(p => [...p, { id: nextId, ...form }]);
        }
        setSelectedId(null);
        setForm(emptyForm);
    };

    const handleDelete = () => {
        if (!selectedId) return;
        setRows(p => p.filter(x => x.id !== selectedId));
        setSelectedId(null);
        setForm(emptyForm);
    };

    const handleCancel = () => {
        setSelectedId(null);
        setForm(emptyForm);
    };

    // === left (form) ===
    const left = (
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Descripción:</Form.Label>
                <Form.Control
                    className="rounded-pill"
                    placeholder="Ej. Multímetro"
                    value={form.descripcion}
                    onChange={(e) => setField("descripcion", e.target.value)}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Categoría:</Form.Label>
                <Form.Control
                    className="rounded-pill"
                    placeholder="Ej. Laboratorio"
                    value={form.categoria}
                    onChange={(e) => setField("categoria", e.target.value)}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Cantidad:</Form.Label>
                <Form.Control
                    type="number" min={0}
                    className="rounded-pill"
                    value={form.cantidad}
                    onChange={(e) => setField("cantidad", Number(e.target.value))}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Observación:</Form.Label>
                <Form.Control
                    className="rounded-pill"
                    placeholder="Opcional"
                    value={form.observacion}
                    onChange={(e) => setField("observacion", e.target.value)}
                />
            </Form.Group>

            <div className="d-grid gap-2 mb-2">
                <Button type="submit" className="rounded-pill"
                    style={{
                        backgroundColor: "var(--c-dark-1)", borderColor: "var(--c-dark-1)",
                        paddingTop: "var(--btn-pad-y)", paddingBottom: "var(--btn-pad-y)"
                    }}>
                    {isEditing ? "Guardar" : "Agregar"}
                </Button>
            </div>

            <div className="d-flex justify-content-between text-uppercase small mb-3">
                <Button variant="link" className="text-decoration-none" disabled={!isEditing}>Editar</Button>
                <Button variant="link" className="text-decoration-none" onClick={handleCancel}>Cancelar</Button>
            </div>

            <ButtonGroup className="w-100 mb-3">
                <Button variant="outline-primary" className="rounded-pill flex-fill"
                    onClick={() => setShowUmbral(true)}>
                    Configurar umbral
                </Button>
                <Button className="rounded-pill flex-fill"
                    style={{ backgroundColor: "var(--danger-900)", borderColor: "var(--danger-900)" }}
                    disabled={!isEditing}
                    onClick={handleDelete}>
                    Dar de baja
                </Button>
            </ButtonGroup>

            {/* Leyenda */}
            <div className="d-flex gap-2 mt-2">
                <Badge bg="success">OK</Badge>
                <Badge bg="warning">BAJO</Badge>
                <Badge bg="danger">CRÍTICO</Badge>
            </div>
        </Form>
    );

    // === right (list & table) ===
    const hasAlerts = rows.some(r => stockLevel(r.cantidad) !== "OK");

    const right = (
        <>
            <Alert variant={hasAlerts ? "warning" : "success"} className="rounded-pill d-flex justify-content-between align-items-center">
                <span className="fw-semibold">
                    {hasAlerts ? "Alertas de stock" : "Sin alertas."}
                </span>
                <small className="text-muted">
                    Umbrales → Bajo ≤ {thresholds.bajo} · Crítico ≤ {thresholds.critico}
                </small>
            </Alert>

            <div className="border-top pt-3">
                <Table hover responsive className="align-middle">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th style={{ width: 110 }}>Cantidad</th>
                            <th>Responsable</th>
                            <th>Observación</th>
                            <th style={{ width: 90 }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, idx) => (
                            <tr key={r.id}
                                onClick={() => handleSelect(r.id)}
                                style={{ cursor: "pointer", background: selectedId === r.id ? "var(--brand-100)" : "transparent" }}>
                                <td>{idx + 1}</td>
                                <td>{r.descripcion}</td>
                                <td>{r.categoria}</td>
                                <td>{r.cantidad}</td>
                                <td>{r.responsable}</td>
                                <td>{r.observacion}</td>
                                <td>{badgeFor(stockLevel(r.cantidad))}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center text-muted">Sin registros.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </>
    );

    return (
        <>
            <FormTableShell
                leftTitle="Formulario"
                rightTitle="Listado"
                left={left}
                right={right}
                leftMd={5}
                rightMd={7}
            />

            {/* Modal de umbrales */}
            <Modal show={showUmbral} onHide={() => setShowUmbral(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Configurar umbrales de stock</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Bajo ≤</Form.Label>
                            <Form.Control type="number" min={1}
                                value={thresholds.bajo}
                                onChange={(e) => setThresholds(t => ({ ...t, bajo: Number(e.target.value) }))} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Crítico ≤</Form.Label>
                            <Form.Control type="number" min={0}
                                value={thresholds.critico}
                                onChange={(e) => setThresholds(t => ({ ...t, critico: Number(e.target.value) }))} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUmbral(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
