import React from "react";
import { Row, Col } from "react-bootstrap";

export default function FormTableShell({
    leftTitle,
    rightTitle,
    left,
    right,
    leftMd = 5,
    rightMd = 7,
}) {
    return (
        <Row className="g-4">
            <Col xs={12} md={leftMd}>
                {leftTitle && <h5 className="mb-3">{leftTitle}</h5>}
                {left}
            </Col>
            <Col xs={12} md={rightMd}>
                {rightTitle && <h5 className="mb-3">{rightTitle}</h5>}
                {right}
            </Col>
        </Row>
    );
}
