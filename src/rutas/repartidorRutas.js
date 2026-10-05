const express = require('express');
const path = require('path');
const router = express.Router();
const repartidorControlador = require('../controladores/repartidorControlador');
const { verificarRol } = require('../middlewares/autenticacion');

router.get('/', verificarRol('Repartidor'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'repartidorPanel.html'));
});
router.get('/entregas', verificarRol('Repartidor'), repartidorControlador.mostrarPanelRepartidor);
router.get('/api/perfil', verificarRol('Repartidor'), repartidorControlador.obtenerPerfil);
router.get('/api/entregas', verificarRol('Repartidor'), repartidorControlador.listarMisEntregas);
router.put('/api/entregas/:id/estado', verificarRol('Repartidor'), repartidorControlador.actualizarEstadoEntrega);

module.exports = router;
