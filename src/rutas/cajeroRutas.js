const express = require('express');
const router = express.Router();
const cajeroControlador = require('../controladores/cajeroControlador');
const { verificarRol } = require('../middlewares/autenticacion');

router.get(
    '/',
    verificarRol('Cajero'),
    cajeroControlador.mostrarPanelCajero
);

module.exports = router;