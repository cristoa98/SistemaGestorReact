// src/layouts/MainLayout.jsx
import { Navbar, Nav, Container, Card } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
    return (
        <>
            {/* Barra superior (título centrado) */}
            <Navbar expand="lg" style={{ backgroundColor: "var(--c-dark-1)" }}>
                <Container className="justify-content-center">
                    <Navbar.Brand className="fs-1 fw-bold text-uppercase" style={{ color: "var(--white)" }}>
                        Gestor Local
                    </Navbar.Brand>
                </Container>
            </Navbar>

            {/* Pestañas centradas con alto contraste */}
            <Navbar expand="lg" style={{ backgroundColor: "var(--c-dark-2)" }}>
                <Container fluid="xxl">
                    <Navbar.Toggle aria-controls="mainNav" className="ms-auto" />
                    <Navbar.Collapse id="mainNav">
                        <Nav className="mx-auto nav-pills gap-2">
                            {[
                                ["Inicio", "/"],
                                ["Solicitudes", "/solicitudes"],
                                ["Inventario", "/inventario"],
                                ["Préstamos", "/prestamos"],
                                /* ["Trazabilidad", "/trazabilidad"],
                                ["Reportes", "/reportes"], */
                                ["Usuarios", "/usuarios"],
                            ].map(([label, to]) => (
                                <LinkContainer key={to} to={to} end={to === "/"}>
                                    <Nav.Link
                                        className="fw-semibold px-3"
                                        style={{
                                            color: "var(--white)",
                                        }}
                                    >
                                        {label}
                                    </Nav.Link>
                                </LinkContainer>
                            ))}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Lienzo central más ancho (xxl) */}
            <div className="py-4" style={{ minHeight: 654, backgroundColor: "var(--c-mid)" }}>
                <Container fluid="xxl">
                    <Card className="shadow-lg border-0"
                        style={{ borderRadius: "var(--radius-2xl)", backgroundColor: "var(--white)" }}>
                        <Card.Body className="p-4 p--5">
                            <Outlet />
                        </Card.Body>
                    </Card>
                </Container>
            </div>

            {/* Faja inferior */}
            <div style={{ backgroundColor: "var(--c-dark-1)", height: 24 }} />
        </>
    );
}
