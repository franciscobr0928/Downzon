const path = require('path');
const db = require('../base_de_datos/conexion');

const mostrarPanelCajero = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'cajero.html')
    );
};
const mostrarReporteVentas=(req,res)=>{
    res.sendFile(
        path.join(__dirname,'..','..','vistas','reporteVentas.html')
    );
};
const obtenerReporteVentas=(req,res)=>{
    db.query(`
        SELECT
            v.id_venta,
            v.fecha,
            p.nombre AS producto,
            d.cantidad,
            d.subtotal,
            v.total
        FROM ventas v
        INNER JOIN detalle_venta d ON v.id_venta=d.id_venta
        INNER JOIN productos p ON d.id_producto=p.id_producto
        ORDER BY v.fecha DESC
    `,(error,resultados)=>{
        if(error){
            console.log(error);
            return res.status(500).json(error);
        }
        res.json(resultados);
    });
};

module.exports = {
    mostrarPanelCajero,
    mostrarReporteVentas,
    obtenerReporteVentas
};
