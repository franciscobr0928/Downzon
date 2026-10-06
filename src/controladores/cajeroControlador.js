const path = require('path');
const ventaDAO = require('../dao/ventaDAO');

const mostrarPanelCajero = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'cajero.html')
    );
};

const mostrarReporteVentas = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'reporteVentas.html')
    );
};

// Devuelve las ventas; si llegan ?desde=AAAA-MM-DD y/o ?hasta=AAAA-MM-DD filtra por ese periodo
const obtenerReporteVentas = (req, res) => {
    const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;
    const desde = req.query.desde || null;
    const hasta = req.query.hasta || null;

    if ((desde && !formatoFecha.test(desde)) || (hasta && !formatoFecha.test(hasta))) {
        return res.status(400).json({ mensaje: 'Formato de fecha inválido' });
    }

    if (desde && hasta && desde > hasta) {
        return res.status(400).json({ mensaje: 'La fecha inicial no puede ser posterior a la final' });
    }

    ventaDAO.obtenerReporte(desde, hasta, (error, resultados) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ mensaje: 'Error al consultar las ventas' });
        }
        res.json(resultados);
    });
};

module.exports = {
    mostrarPanelCajero,
    mostrarReporteVentas,
    obtenerReporteVentas
};
