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
    const { id_producto, cantidad } = req.body;
    if (!cantidad || cantidad <= 0) return res.status(400).json({ mensaje: "Cantidad inválida" });
    // Forma infalible: Busca id_usuario, si no existe busca id, y si todo falla, usa 2 a la fuerza.
    const id_panadero = req.session?.usuario?.id_usuario || req.session?.usuario?.id || 3;

    panaderoDAO.guardarProduccion(id_producto, id_panadero, cantidad, (error, resultados) => {
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

module.exports = {
    mostrarPanelPanadero,
    obtenerReceta,
    registrarProduccion
};