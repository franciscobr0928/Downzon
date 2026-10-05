const express = require('express');
const path = require('path');
const router = express.Router();
const panaderoControlador = require('../controladores/panaderoControlador');
const { verificarRol } = require('../middlewares/autenticacion');

// Panel de opciones del panadero
router.get(
    '/',
    verificarRol('Panadero'),
    (req, res) => {
        res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'panaderoPanel.html'));
    }
);

// Vistas de las funciones existentes
router.get('/produccion', verificarRol('Panadero'), panaderoControlador.mostrarPanelPanadero);
router.get('/recetas', verificarRol('Panadero'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'panaderoRecetas.html'));
});
router.get('/historial', verificarRol('Panadero'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'panaderoHistorial.html'));
});

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

// Datos para la interfaz del panadero
router.get('/api/perfil', verificarRol('Panadero'), panaderoControlador.obtenerPerfil);
router.get('/api/produccion', verificarRol('Panadero'), panaderoControlador.obtenerHistorial);
router.get('/api/vencimientos', verificarRol('Panadero'), panaderoControlador.obtenerVencimientos);

module.exports = router;