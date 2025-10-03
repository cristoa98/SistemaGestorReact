// src/components/FormTableShell.jsx
import { Row, Col, Card } from "react-bootstrap";

export default function FormTableShell({
    leftTitle = "Formulario",
    rightTitle = "Listado",
    left,
    right,
    leftMd = 5,        // 5/7 por defecto (puedes ajustar)
    rightMd = 7,
}) {
    return (
        <Row className="g-4">
            {/* Izquierda: Card de formulario */}
            <Col md={leftMd}>
                <Card
                    className="h-100 border-0"
                    style={{ borderRadius: "var(--radius-2xl)", backgroundColor: "var(--brand-100)" }}
                >
                    <Card.Body className="p-4">
                        <h6 className="text-uppercase fw-bold mb-3" style={{ color: "var(--text)" }}>
                            {leftTitle}
                        </h6>
                        {left}
                    </Card.Body>
                </Card>
            </Col>

            {/* Derecha: Card con marco oscuro + card blanca interna */}
            <Col md={rightMd}>
                <Card
                    className="p-3 border-0"
                    style={{
                        borderRadius: "var(--radius-2xl)",
                        backgroundColor: "var(--c-dark-2)",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.15)",
                    }}
                >
                    <Card className="border-0" style={{ borderRadius: "var(--radius-xl)", backgroundColor: "var(--white)" }}>
                        <Card.Body className="p-3 p-md-4">
                            <h6 className="text-uppercase fw-bold mb-3" style={{ color: "var(--text)" }}>
                                {rightTitle}
                            </h6>
                            {right}
                        </Card.Body>
                    </Card>
                </Card>
            </Col>
        </Row>
    );
}
