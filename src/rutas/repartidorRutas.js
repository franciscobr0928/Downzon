const express = require('express');
const router = express.Router();
const repartidorControlador = require('../controladores/repartidorControlador');
const { verificarRol } = require('../middlewares/autenticacion');

router.get('/', verificarRol('Repartidor'), repartidorControlador.mostrarPanelRepartidor);
router.get('/api/perfil', verificarRol('Repartidor'), repartidorControlador.obtenerPerfil);
router.get('/api/entregas', verificarRol('Repartidor'), repartidorControlador.listarMisEntregas);
router.put('/api/entregas/:id/estado', verificarRol('Repartidor'), repartidorControlador.actualizarEstadoEntrega);

module.exports = router;
