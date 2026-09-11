const productoDAO = require('../dao/productoDAO');

const obtenerProductos = (req, res) => {
    productoDAO.obtenerTodos((error, productos) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error al obtener los productos');
        }

        res.json(productos);
    });
};

const eliminarProducto = (req, res) => {
    const id = parseInt(req.params.id);

    productoDAO.eliminarPorId(id, (error, resultado) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: 'Error al eliminar el producto'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            mensaje: 'Producto eliminado correctamente'
        });
    });
};

module.exports = {
    obtenerProductos,
    eliminarProducto
};