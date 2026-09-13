const express = require('express');
const router = express.Router();
const productoControlador = require('../controladores/productoControlador');
const { verificarRol } = require('../middlewares/autenticacion');
const subirImagen = require('../middlewares/subirImagen');

router.get(
    '/',
    productoControlador.obtenerProductos
);

router.get(
    '/:id',
    productoControlador.obtenerProductoPorId
);

router.post(
    '/',
    verificarRol('Gerente'),
    subirImagen.single('imagen'),
    productoControlador.agregarProducto
);

router.put(
    '/:id',
    verificarRol('Gerente'),
    subirImagen.single('imagen'),
    productoControlador.actualizarProducto
);

router.delete(
    '/:id',
    verificarRol('Gerente'),
    productoControlador.eliminarProducto
);

module.exports = router;