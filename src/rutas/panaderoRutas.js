const express = require('express');
const router = express.Router();
const panaderoControlador = require('../controladores/panaderoControlador');
const { verificarRol } = require('../middlewares/autenticacion');

// Ruta principal: Mostrar el panel HTML
router.get(
    '/',
    verificarRol('Panadero'),
    panaderoControlador.mostrarPanelPanadero
);

// Nueva ruta: API para obtener los ingredientes de una receta por ID
router.get(
    '/api/recetas/:id',
    verificarRol('Panadero'),
    panaderoControlador.obtenerReceta
);

// Nueva ruta: Procesar el formulario de producción de pan
router.post(
    '/produccion/registrar',
    verificarRol('Panadero'),
    panaderoControlador.registrarProduccion
);

module.exports = router;