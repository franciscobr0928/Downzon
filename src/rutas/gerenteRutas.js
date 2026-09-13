const express = require('express');
const router = express.Router();
const gerenteControlador = require('../controladores/gerenteControlador');
const { verificarRol } = require('../middlewares/autenticacion');

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

module.exports = router;
