const path = require('path');
const panaderoDAO = require('../dao/panaderoDAO');

const mostrarHistorial = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'gerenteProduccion.html'));
};

const obtenerHistorial = (req, res) => {
    panaderoDAO.obtenerHistorialProduccion((error, resultados) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ mensaje: 'Error al consultar el historial de producción' });
        }
        res.json(resultados);
    });
};

const mostrarVencimientos = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'gerenteVencimientos.html'));
};

const obtenerVencimientos = (req, res) => {
    // Días de anticipación (por defecto 3, máximo 30)
    let dias = parseInt(req.query.dias, 10);
    if (isNaN(dias) || dias < 0) dias = 3;
    if (dias > 30) dias = 30;

    panaderoDAO.obtenerProximosAVencer(dias, (error, resultados) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ mensaje: 'Error al consultar los productos por vencer' });
        }
        res.json(resultados);
    });
};

module.exports = {
    mostrarHistorial,
    obtenerHistorial,
    mostrarVencimientos,
    obtenerVencimientos
};
