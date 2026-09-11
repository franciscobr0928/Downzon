const express = require('express');
const router = express.Router();
const productoControlador = require('../controladores/productoControlador');
const { verificarRol } = require('../middlewares/autenticacion');
router.get(
    '/',
    productoControlador.obtenerProductos
);
router.delete(
    '/:id',
    verificarRol('Gerente'),
    productoControlador.eliminarProducto
);
module.exports = router;
