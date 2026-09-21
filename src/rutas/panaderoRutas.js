const express = require('express');
const router = express.Router();
const panaderoControlador = require('../controladores/panaderoControlador');
const { verificarRol } = require('../middlewares/autenticacion');

router.get(
    '/',
    verificarRol('Panadero'),
    panaderoControlador.mostrarPanelPanadero
);

module.exports = router;
