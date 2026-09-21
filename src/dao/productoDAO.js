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

const agregarProducto = (producto, callback) => {
    const consulta = `
        INSERT INTO productos
        (nombre, descripcion, precio, cantidad, imagen)
        VALUES (?, ?, ?, ?, ?)
    `;
    const valores = [
        producto.nombre,
        producto.descripcion,
        producto.precio,
        producto.cantidad,
        producto.imagen
    ];
    conexion.query(consulta, valores, (error, resultado) => {
        if (error) {
            return callback(error, null);
        }
        callback(null, resultado);
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

const obtenerPorId = (id, callback) => {
    const consulta = `
        SELECT *
        FROM productos
        WHERE id_producto = ?
    `;
    conexion.query(consulta, [id], (error, resultados) => {
        if (error) {
            return callback(error, null);
        }
        if (resultados.length === 0) {
            return callback(null, null);
        }
        const datos = resultados[0];
        const producto = new Producto(
            datos.id_producto,
            datos.nombre,
            datos.descripcion,
            datos.precio,
            datos.cantidad,
            datos.imagen
        );
        callback(null, producto);
    });
};

const actualizarProducto = (id, producto, callback) => {
    const consulta = `
        UPDATE productos
        SET nombre = ?,
            descripcion = ?,
            precio = ?,
            cantidad = ?,
            imagen = ?
        WHERE id_producto = ?
    `;
    const valores = [
        producto.nombre,
        producto.descripcion,
        producto.precio,
        producto.cantidad,
        producto.imagen,
        id
    ];
    conexion.query(consulta, valores, (error, resultado) => {
        if (error) {
            return callback(error, null);
        }
        callback(null, resultado);
    });
};

module.exports = {
    obtenerTodos,
    eliminarPorId,
    agregarProducto,
    obtenerPorId,
    actualizarProducto
};