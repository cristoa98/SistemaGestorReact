import React from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TABS = [
    { label: "Inicio", path: "/" },
    { label: "Inventario", path: "/inventario" },
    { label: "Solicitudes", path: "/solicitudes" },
    { label: "Préstamos", path: "/prestamos" },
    { label: "Usuarios", path: "/usuarios", adminOnly: true },
];

export default function MainLayout() {
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();

    const isAdmin = isAuthenticated && user?.rol === "admin";

    return (
        <>
            {/* barra superior */}
            <Navbar
                expand="lg"
                variant="dark"
                className="app-topbar"
            >
                <Container fluid className="px-3 px-md-4">
                    <Navbar.Brand className="fw-bold text-uppercase">
                        GESTOR LOCAL
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="topbar" />
                    <Navbar.Collapse id="topbar" className="justify-content-end">
                        {isAuthenticated ? (
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-light small">
                                    {user?.nombre} ({user?.rol})
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light"
                                    onClick={logout}
                                >
                                    Cerrar sesión
                                </button>
                            </div>
                        ) : (
                            <LinkContainer to="/login">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light"
                                >
                                    Iniciar sesión
                                </button>
                            </LinkContainer>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* pestañas */}
            <Navbar
                expand="lg"
                variant="dark"
                className="app-tabsbar"
            >
                <Container fluid className="px-3 px-md-4">
                    <Navbar.Toggle aria-controls="mainnav" />
                    <Navbar.Collapse id="mainnav">
                        <Nav className="mx-auto">
                            {TABS.map((tab) => {
                                if (tab.adminOnly && !isAdmin) return null;

                                const active =
                                    tab.path === "/"
                                        ? location.pathname === "/"
                                        : location.pathname.startsWith(tab.path);

                                return (
                                    <LinkContainer key={tab.path} to={tab.path} end={tab.path === "/"}>
                                        <Nav.Link active={active} className="px-3">
                                            {tab.label}
                                        </Nav.Link>
                                    </LinkContainer>
                                );
                            })}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* contenido centrado */}
            <main className="py-4" style={{ minHeight: "calc(100vh - 120px)" }}>
                <Container fluid className="px-3 px-md-4">
                    <div className="row justify-content-center">
                        <div className="col-12 col-xl-10">
                            <div className="card shadow-sm app-main-card">
                                <div className="card-body">
                                    <Outlet />
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </main>

            <footer className="app-footer text-center py-2 small">
                Gestor Local
            </footer>
        </>
    );
}
