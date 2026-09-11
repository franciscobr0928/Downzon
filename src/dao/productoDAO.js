const conexion = require('../base_de_datos/conexion');
const Producto = require('../entidades/Producto');

const obtenerTodos = (callback) => {
    const consulta = `
        SELECT *
        FROM productos
    `;

    conexion.query(consulta, (error, resultados) => {
        if (error) {
            return callback(error, null);
        }

        const productos = resultados.map(datos => {
            return new Producto(
                datos.id_producto,
                datos.nombre,
                datos.descripcion,
                datos.precio,
                datos.cantidad,
                datos.imagen
            );
        });

        callback(null, productos);
    });
};

const eliminarPorId = (id, callback) => {
    const consulta = `
        DELETE FROM productos
        WHERE id_producto = ?
    `;

    conexion.query(consulta, [id], (error, resultado) => {
        if (error) {
            return callback(error);
        }

        callback(null, resultado);
    });
};

module.exports = {
    obtenerTodos,
    eliminarPorId
};