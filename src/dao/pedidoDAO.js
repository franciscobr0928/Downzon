const conexionBase = require('../base_de_datos/conexion');

const guardarPedido = async (pedido) => {
    const conexion = await conexionBase.crearConexion();
    try {
        await conexion.beginTransaction();

        const ids = [...new Set(pedido.productos.map(p => p.id_producto))];
        const marcas = ids.map(() => '?').join(',');
        const [productos] = await conexion.query(
            `SELECT id_producto, nombre, precio FROM productos
             WHERE id_producto IN (${marcas})`, ids
        );
        const catalogo = new Map(productos.map(p => [p.id_producto, p]));
        let totalCentavos = 0;
        const detalles = pedido.productos.map(item => {
            const producto = catalogo.get(item.id_producto);
            if (!producto) {
                const error = new Error('Uno de los productos ya no existe. Recarga el catálogo.');
                error.status = 400;
                throw error;
            }
            // El precio se toma de MySQL, nunca del navegador.
            const precio = String(producto.precio);
            if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
                const error = new Error('Un producto tiene un precio inválido. Solicita su revisión.');
                error.status = 400;
                throw error;
            }
            const [entero, decimal = ''] = precio.split('.');
            const centavos = Number(entero) * 100 + Number(decimal.padEnd(2, '0'));
            const subtotal = centavos * item.cantidad;
            totalCentavos += subtotal;
            return [item.id_producto, producto.nombre, item.cantidad,
                (centavos / 100).toFixed(2), (subtotal / 100).toFixed(2), item.indicaciones || null];
        });
        if (!Number.isSafeInteger(totalCentavos) || totalCentavos > 999999999999) {
            const error = new Error('El importe del pedido supera el límite permitido.');
            error.status = 400;
            throw error;
        }
        const total = (totalCentavos / 100).toFixed(2);
        const [resultado] = await conexion.query(
            `INSERT INTO pedidos
             (id_usuario, nombre_cliente, telefono, tipo_entrega, direccion,
              referencias, fecha_entrega, notas_preparacion, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [pedido.id_usuario, pedido.nombre_cliente, pedido.telefono,
                pedido.tipo_entrega, pedido.direccion, pedido.referencias,
                pedido.fecha_entrega, pedido.notas_preparacion || null, total]
        );
        const filas = detalles.map(detalle => [resultado.insertId, ...detalle]);
        await conexion.query(
            `INSERT INTO detalle_pedido
             (id_pedido, id_producto, nombre_producto, cantidad,
              precio_unitario, subtotal, indicaciones) VALUES ?`, [filas]
        );
        await conexion.commit();
        return { idPedido: resultado.insertId, total };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
    await conexion.end().catch(errorCierre => {
        console.error(
            'Error al cerrar conexión del pedido:',
            errorCierre.message
        );
    });
}
};

module.exports = { guardarPedido };
