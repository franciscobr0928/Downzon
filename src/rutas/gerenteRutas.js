const express = require('express');
const router = express.Router();
const gerenteControlador = require('../controladores/gerenteControlador');
const { verificarRol } = require('../middlewares/autenticacion');
const produccionControlador = require('../controladores/produccionControlador');

router.get(
    '/',
    verificarRol('Gerente'),
    gerenteControlador.mostrarPanelGerente
);

router.get(
    '/productos',
    verificarRol('Gerente'),
    gerenteControlador.mostrarGestionProductos
);

router.get(
    '/productos/agregar',
    verificarRol('Gerente'),
    gerenteControlador.mostrarAgregarProducto
);

router.get(
    '/productos/editar/:id',
    verificarRol('Gerente'),
    gerenteControlador.mostrarEditarProducto
);

router.get(
    '/almacen',
    verificarRol('Gerente'),
    gerenteControlador.mostrarAlmacen
);

router.get(
    '/almacen/inventario/:id',
    verificarRol('Gerente'),
    gerenteControlador.obtenerIngrediente
);

router.get(
    '/almacen/inventario',
    verificarRol('Gerente'),
    gerenteControlador.obtenerInventario
);

router.put(
    '/almacen/entrada',
    verificarRol('Gerente'),
    gerenteControlador.agregarEntrada
);

router.get(
    '/almacen/entradas',
    verificarRol('Gerente'),
    gerenteControlador.obtenerEntradas
);

router.put(
    '/almacen/salida',
    verificarRol('Gerente'),
    gerenteControlador.retirarStock
);

router.get(
    '/almacen/salidas',
    verificarRol('Gerente'),
    gerenteControlador.obtenerSalidas
);

router.get(
    '/almacen/estadisticas',
    verificarRol('Gerente'),
    gerenteControlador.obtenerEstadisticasAlmacen
);

// Producción: panadero responsable
router.get('/produccion', verificarRol('Gerente'), produccionControlador.mostrarHistorial);
router.get('/produccion/historial', verificarRol('Gerente'), produccionControlador.obtenerHistorial);

// Productos próximos a vencer
router.get('/vencimientos', verificarRol('Gerente'), produccionControlador.mostrarVencimientos);
router.get('/vencimientos/api', verificarRol('Gerente'), produccionControlador.obtenerVencimientos);

module.exports = router;
