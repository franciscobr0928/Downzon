const express = require('express');
const path = require('path');

const router = express.Router();

const cajeroControlador = require('../controladores/cajeroControlador');
const pedidoControlador = require('../controladores/pedidoControlador');

const { verificarRol } = require('../middlewares/autenticacion');

// Panel del cajero
router.get(
    '/',
    verificarRol('Cajero'),
    cajeroControlador.mostrarPanelCajero
);

// Punto de venta
router.get(
    '/venta',
    verificarRol('Cajero'),
    (req, res) => {
        res.sendFile(
            path.join(__dirname, '..', '..', 'vistas', 'ventas.html')
        );
    }
);

// Pantalla de registro de pedidos
router.get(
    '/pedidos',
    verificarRol('Cajero'),
    pedidoControlador.mostrarRegistroPedidos
);

// Guardar pedido
router.post(
    '/pedidos/registrar',
    verificarRol('Cajero'),
    pedidoControlador.registrarPedido
);

module.exports = router;