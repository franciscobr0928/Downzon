const express = require('express');
const path = require('path');

const router = express.Router();

const cajeroControlador = require('../controladores/cajeroControlador');
const pedidoControlador = require('../controladores/pedidoControlador');
const entregaControlador = require('../controladores/entregaControlador');

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

// Visualizar pedidos: consulta, seguimiento, repartidores y asignación
router.get(
    '/visualizar-pedidos',
    verificarRol('Cajero'),
    pedidoControlador.mostrarVisualizarPedidos
);
router.get(
    '/reportes',
    verificarRol('Cajero'),
    cajeroControlador.mostrarReporteVentas
);
router.get(
    '/reporte-ventas',
    verificarRol('Cajero'),
    cajeroControlador.mostrarReporteVentas
);
router.get(
    '/reporte-ventas/datos',
    verificarRol('Cajero'),
    cajeroControlador.obtenerReporteVentas
);
router.get('/api/pedidos', verificarRol('Cajero'), pedidoControlador.listarPedidos);
router.get('/api/pedidos/:id', verificarRol('Cajero'), pedidoControlador.obtenerDetallePedido);
router.put('/api/pedidos/:id/estado', verificarRol('Cajero'), pedidoControlador.cambiarEstadoPedido);
router.put('/api/pedidos/:id/repartidor', verificarRol('Cajero'), entregaControlador.asignarRepartidor);
router.get('/api/repartidores', verificarRol('Cajero'), entregaControlador.listarRepartidores);
router.post('/api/repartidores', verificarRol('Cajero'), entregaControlador.altaRepartidor);

module.exports = router;