const path = require('path');
// Importamos el DAO que ya contiene la lógica de base de datos
const panaderoDAO = require('../dao/panaderoDAO'); 

const mostrarPanelPanadero = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'panadero.html')
    );
};

const obtenerReceta = (req, res) => {
    const idProducto = req.params.id;
    // Llamamos a la función del DAO
    panaderoDAO.obtenerRecetaPorProducto(idProducto, (error, resultados) => {
        if (error) {
            console.error("Error al obtener receta:", error);
            return res.status(500).json({ mensaje: 'Error al consultar la base de datos' });
        }
        res.json(resultados);
    });
};

const registrarProduccion = (req, res) => {
    const { id_producto, cantidad, fecha_consumo_preferente } = req.body;
    if (!cantidad || cantidad <= 0) return res.status(400).json({ mensaje: "Cantidad inválida" });

    // El panadero responsable es SIEMPRE el usuario que tiene la sesión iniciada
    const id_panadero = req.session.idUsuario;
    if (!id_panadero) {
        return res.status(401).json({ mensaje: "Tu sesión no tiene un panadero asociado. Cierra sesión e inicia de nuevo." });
    }

    // Fecha de consumo preferente: formato AAAA-MM-DD y no anterior a hoy
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_consumo_preferente || '')) {
        return res.status(400).json({ mensaje: "Indica la fecha de consumo preferente" });
    }
    const hoy = new Date();
    const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (fecha_consumo_preferente < hoyTexto) {
        return res.status(400).json({ mensaje: "La fecha de consumo preferente no puede ser anterior a hoy" });
    }

    panaderoDAO.guardarProduccion(id_producto, id_panadero, cantidad, fecha_consumo_preferente, (error, resultados) => {
        if (error) {
            // Verificamos si el error es porque no hay stock
            if (error.codigo === 'STOCK_INSUFICIENTE') {
                return res.status(400).json({ mensaje: error.message });
            }
            
            console.error("Error al registrar producción:", error);
            return res.status(500).json({ mensaje: "Error al guardar la producción en la base de datos." });
        }
        
        res.json({ mensaje: "¡Producción guardada! El inventario se ha actualizado correctamente." });
    });
};

const obtenerPerfil = (req, res) => {
    res.json({ nombre: req.session.nombre || req.session.usuario });
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

const obtenerVencimientos = (req, res) => {
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
    mostrarPanelPanadero,
    obtenerReceta,
    registrarProduccion,
    obtenerPerfil,
    obtenerHistorial,
    obtenerVencimientos
};