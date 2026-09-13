const productoDAO = require('../dao/productoDAO');
const fs = require('fs');
const path = require('path');

const obtenerProductos = (req, res) => {
    productoDAO.obtenerTodos((error, productos) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error al obtener los productos');
        }
        res.json(productos);
    });
};

const agregarProducto = (req, res) => {
    const producto = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        precio: req.body.precio,
        cantidad: req.body.cantidad,
        imagen: req.file ? req.file.filename : null
    };
    productoDAO.agregarProducto(producto, (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error al agregar el producto');
        }
        res.redirect('/gerente/productos');
    });
};

const eliminarProducto = (req, res) => {
    const id = parseInt(req.params.id);
    productoDAO.obtenerPorId(id, (error, producto) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: 'Error al obtener el producto'
            });
        }
        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }
        productoDAO.eliminarPorId(id, (error, resultado) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    mensaje: 'Error al eliminar el producto'
                });
            }
            if (producto.imagen) {
                const rutaImagen = path.join(
                    __dirname,
                    '..',
                    '..',
                    'public',
                    'img',
                    'productos',
                    producto.imagen
                );
                fs.unlink(rutaImagen, (error) => {
                    if (error && error.code !== 'ENOENT') {
                        console.error(error);
                    }
                });
            }
            res.json({
                mensaje: 'Producto eliminado correctamente'
            });
        });
    });
};

const obtenerProductoPorId = (req, res) => {
    const id = parseInt(req.params.id);
    productoDAO.obtenerPorId(id, (error, producto) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: 'Error al obtener el producto'
            });
        }
        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }
        res.json(producto);
    });
};

const actualizarProducto = (req, res) => {
    const id = parseInt(req.params.id);
    const imagen = req.file
        ? req.file.filename
        : req.body.imagen_actual || null;
    const producto = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        precio: req.body.precio,
        cantidad: req.body.cantidad,
        imagen: imagen
    };
    productoDAO.actualizarProducto(id, producto, (error, resultado) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: 'Error al actualizar el producto'
            });
        }
        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }
        if (req.file && req.body.imagen_actual) {
            const rutaImagenAnterior = path.join(
                __dirname,
                '..',
                '..',
                'public',
                'img',
                'productos',
                req.body.imagen_actual
            );
            fs.unlink(rutaImagenAnterior, (error) => {
                if (error && error.code !== 'ENOENT') {
                    console.error(error);
                }
            });
        }
        res.json({
            mensaje: 'Producto actualizado correctamente'
        });
    });
};

module.exports = {
    obtenerProductos,
    eliminarProducto,
    agregarProducto,
    obtenerProductoPorId,
    actualizarProducto
};