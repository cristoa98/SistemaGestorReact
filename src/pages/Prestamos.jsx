import { useMemo, useState } from "react";
import { Form, Button, Table, Badge, ButtonGroup, Alert } from "react-bootstrap";
import FormTableShell from "../components/FormTableShell";

// ---------- utilidades ----------
const fmt = (d) => new Date(d).toLocaleDateString("es-CL");
const isSameDay = (a, b = new Date()) => {
    const d1 = new Date(a), d2 = new Date(b);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};
const estadoPrestamo = (row) => {
    const queda = row.prestado - row.devuelto;
    if (queda <= 0) return "COMPLETO";
    if (new Date(row.fechaVence) < new Date()) return "VENCIDO";
    return "EN CURSO";
};
const badgeEstado = (estado) => {
    if (estado === "COMPLETO") return "success";
    if (estado === "VENCIDO") return "danger";
    return "primary"; // EN CURSO
};

// ---------- demo ----------
const initialLoans = [
    {
        id: 1,
        correlativo: "P-2025-0001",
        persona: "Juan Pérez",
        descripcion: "Multímetro",
        prestado: 2,
        devuelto: 0,
        fechaPrestamo: new Date(),                     // hoy
        fechaVence: new Date(new Date().setDate(new Date().getDate() + 1)), // mañana
    },
    {
        id: 2,
        correlativo: "P-2025-0002",
        persona: "Prof. Díaz",
        descripcion: "Set de cables",
        prestado: 5,
        devuelto: 2,
        fechaPrestamo: new Date(new Date().setDate(new Date().getDate() - 2)),
        fechaVence: new Date(), // vence hoy
    },
    {
        id: 3,
        correlativo: "P-2025-0003",
        persona: "María Soto",
        descripcion: "Fuente DC 30V/5A",
        prestado: 1,
        devuelto: 0,
        fechaPrestamo: new Date(new Date().setDate(new Date().getDate() - 5)),
        fechaVence: new Date(new Date().setDate(new Date().getDate() - 1)), // vencido
    },
];

export default function Prestamos() {
    const [rows, setRows] = useState(initialLoans);
    const [selectedId, setSelectedId] = useState(null);

    const [soloHoy, setSoloHoy] = useState(false);
    const [cantidadDevolver, setCantidadDevolver] = useState(1);
    const [flash, setFlash] = useState(null); // {type,msg}

    const selected = rows.find((r) => r.id === selectedId) || null;
    const saldo = selected ? Math.max(0, selected.prestado - selected.devuelto) : 0;
    const estadoSel = selected ? estadoPrestamo(selected) : null;

    const filtered = useMemo(
        () => rows.filter((r) => (soloHoy ? isSameDay(r.fechaVence) : true)),
        [rows, soloHoy]
    );

    // ---------- acciones ----------
    const handleSelect = (id) => {
        setSelectedId(id);
        setCantidadDevolver(1);
        setFlash(null);
    };

    const handleDevolver = (e) => {
        e.preventDefault();
        if (!selected) return;
        const cant = Number(cantidadDevolver);
        if (!cant || cant <= 0) return;
        const nuevoDevuelto = Math.min(selected.prestado, selected.devuelto + cant);

        setRows((prev) =>
            prev.map((x) => (x.id === selected.id ? { ...x, devuelto: nuevoDevuelto } : x))
        );
        setFlash({ type: "success", msg: "Devolución registrada." });
        setCantidadDevolver(1);
    };

    const handleCancelar = () => {
        setSelectedId(null);
        setCantidadDevolver(1);
        setFlash(null);
    };

    const handleAnular = () => {
        if (!selected) return;
        setRows((prev) => prev.filter((x) => x.id !== selected.id));
        setSelectedId(null);
        setFlash({ type: "info", msg: "Préstamo anulado." });
    };

    const handleImprimir = () => {
        if (!selected) return;
        window.alert(
            `Ticket demo\nCorrelativo: ${selected.correlativo}\nPersona: ${selected.persona}\nDescripción: ${selected.descripcion}\nPrestado: ${selected.prestado}\nDevuelto: ${selected.devuelto}`
        );
    };

    const handleRecordatorio = () => {
        if (!selected) return;
        window.alert(
            `Recordatorio demo enviado a ${selected.persona} para ${selected.descripcion} (vence ${fmt(selected.fechaVence)}).`
        );
    };

    // ---------- izquierda (form) ----------
    const left = (
        <Form onSubmit={handleDevolver}>

            {flash && (
                <Alert
                    variant={flash.type}
                    className="rounded-pill py-2 px-3 mb-3"
                    onClose={() => setFlash(null)}
                    dismissible
                >
                    {flash.msg}
                </Alert>
            )}

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Cantidad a devolver:</Form.Label>
                <Form.Control
                    type="number"
                    min={1}
                    max={saldo || 1}
                    className="rounded-pill"
                    value={cantidadDevolver}
                    onChange={(e) => setCantidadDevolver(Number(e.target.value))}
                    disabled={!selected || saldo <= 0}
                />
                {selected && (
                    <small className="text-muted d-block mt-1">
                        Prestado: {selected.prestado} · Devuelto: {selected.devuelto} · Restante: {saldo}
                    </small>
                )}
            </Form.Group>

            <div className="d-flex gap-2 mb-3">
                <Button
                    type="submit"
                    className="rounded-pill flex-fill"
                    style={{ backgroundColor: "var(--c-dark-1)", borderColor: "var(--c-dark-1)" }}
                    disabled={!selected || saldo <= 0}
                >
                    Devolver
                </Button>
                <Button variant="link" className="text-decoration-none flex-fill" onClick={handleCancelar}>
                    Cancelar
                </Button>
            </div>

            <Button
                className="rounded-pill w-100"
                style={{ backgroundColor: "var(--danger-900)", borderColor: "var(--danger-900)" }}
                onClick={handleAnular}
                disabled={!selected}
            >
                Anular
            </Button>
        </Form>
    );

    // ---------- derecha (listado) ----------
    const right = (
        <>
            <div className="d-flex align-items-center gap-2 mb-3">
                <Form.Check
                    type="checkbox"
                    id="solo-hoy"
                    label="Solo hoy"
                    checked={soloHoy}
                    onChange={(e) => setSoloHoy(e.target.checked)}
                />
                <ButtonGroup>
                    <Button variant="outline-secondary" className="rounded-pill" onClick={handleImprimir} disabled={!selected}>
                        Imprimir ticket
                    </Button>
                    <Button variant="outline-secondary" className="rounded-pill" onClick={handleRecordatorio} disabled={!selected}>
                        Enviar recordatorio
                    </Button>
                </ButtonGroup>
            </div>

            <Table hover responsive className="align-middle">
                <thead>
                    <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Correlativo</th>
                        <th>Persona</th>
                        <th>Descripción</th>
                        <th>Prestado</th>
                        <th>Devuelto</th>
                        <th>Vence</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((r, idx) => {
                        const est = estadoPrestamo(r);
                        return (
                            <tr
                                key={r.id}
                                onClick={() => handleSelect(r.id)}
                                style={{
                                    cursor: "pointer",
                                    background: selectedId === r.id ? "var(--brand-100)" : "transparent",
                                }}
                            >
                                <td>{idx + 1}</td>
                                <td>{r.correlativo}</td>
                                <td>{r.persona}</td>
                                <td>{r.descripcion}</td>
                                <td>{r.prestado}</td>
                                <td>{r.devuelto}</td>
                                <td>{fmt(r.fechaVence)}</td>
                                <td>
                                    <Badge bg={badgeEstado(est)} className="text-uppercase">
                                        {est}
                                    </Badge>
                                </td>
                            </tr>
                        );
                    })}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={8} className="text-center text-muted">
                                Sin préstamos en curso…
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </>
    );

    return (
        <FormTableShell
            leftTitle="Devolución"
            rightTitle="Préstamos en curso"
            left={left}
            right={right}
            leftMd={5}
            rightMd={7}
        />
    );
}
