const conexionBase = require('../base_de_datos/conexion');
const { errorHttp, estadosPermitidosCajero } = require('../entidades/pedidos');

// Consultas de solo lectura sobre la conexión compartida.
const consultar = (sql, parametros = []) =>
    conexionBase.promise().query(sql, parametros).then(([filas]) => filas);

const cerrar = conexion => conexion.end().catch(error => {
    console.error('Error al cerrar conexión:', error.message);
});

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

// Datos de un pedido junto con su entrega (si ya tiene repartidor).
const SELECT_PEDIDO = `
    SELECT p.id_pedido, p.nombre_cliente, p.telefono, p.tipo_entrega,
           p.direccion, p.referencias, p.notas_preparacion, p.total, p.estado,
           DATE_FORMAT(p.fecha_entrega, '%Y-%m-%d %H:%i') AS fecha_entrega,
           DATE_FORMAT(p.fecha_registro, '%Y-%m-%d %H:%i') AS fecha_registro,
           e.id_entrega, e.id_repartidor, e.estado AS estado_entrega,
           u.nombre AS repartidor
    FROM pedidos p
    LEFT JOIN entregas e ON e.id_pedido = p.id_pedido
    LEFT JOIN usuarios u ON u.id_usuario = e.id_repartidor
`;

const obtenerPedidos = ({ estado, busqueda } = {}) => {
    const condiciones = [];
    const parametros = [];
    if (estado) {
        condiciones.push('p.estado = ?');
        parametros.push(estado);
    }
    if (busqueda) {
        const patron = `%${busqueda.replace(/[\\%_]/g, '\\$&')}%`;
        condiciones.push('(p.nombre_cliente LIKE ? OR p.telefono LIKE ? OR p.id_pedido = ?)');
        parametros.push(patron, patron, /^\d{1,10}$/.test(busqueda) ? Number(busqueda) : 0);
    }
    const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    // Primero los pedidos activos, los más próximos a entregar arriba.
    return consultar(
        `${SELECT_PEDIDO} ${donde}
         ORDER BY (p.estado IN ('Entregado', 'Cancelado')), p.fecha_entrega ASC
         LIMIT 300`,
        parametros
    );
};

const contarPorEstado = () =>
    consultar('SELECT estado, COUNT(*) AS total FROM pedidos GROUP BY estado');

const obtenerDetallePedido = async idPedido => {
    const pedidos = await consultar(`${SELECT_PEDIDO} WHERE p.id_pedido = ?`, [idPedido]);
    if (!pedidos.length) return null;
    const productos = await consultar(
        `SELECT nombre_producto, cantidad, precio_unitario, subtotal, indicaciones
         FROM detalle_pedido WHERE id_pedido = ? ORDER BY id_detalle_pedido`,
        [idPedido]
    );
    return { pedido: pedidos[0], productos };
};

// Cambia el estado validando la transición con el pedido bloqueado.
// Al cancelar libera al repartidor si la entrega aún no salió.
const cambiarEstadoPedido = async (idPedido, nuevoEstado) => {
    const conexion = await conexionBase.crearConexion();
    try {
        await conexion.beginTransaction();
        const [pedidos] = await conexion.query(
            'SELECT estado, tipo_entrega FROM pedidos WHERE id_pedido = ? FOR UPDATE',
            [idPedido]
        );
        if (!pedidos.length) throw errorHttp(404, 'El pedido no existe.');
        const { estado, tipo_entrega: tipoEntrega } = pedidos[0];
        if (!estadosPermitidosCajero(estado, tipoEntrega).includes(nuevoEstado)) {
            throw errorHttp(409, `No se puede cambiar un pedido de "${estado}" a "${nuevoEstado}".`);
        }
        if (nuevoEstado === 'Cancelado') {
            const [entregas] = await conexion.query(
                'SELECT estado FROM entregas WHERE id_pedido = ? FOR UPDATE',
                [idPedido]
            );
            if (entregas.length && entregas[0].estado === 'En camino') {
                throw errorHttp(409, 'El repartidor ya va en camino; el pedido no se puede cancelar.');
            }
            if (entregas.length) {
                await conexion.query('DELETE FROM entregas WHERE id_pedido = ?', [idPedido]);
            }
        }
        await conexion.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [nuevoEstado, idPedido]);
        await conexion.commit();
        return { id_pedido: idPedido, estado: nuevoEstado };
    } catch (error) {
        await conexion.rollback().catch(() => {});
        throw error;
    } finally {
        await cerrar(conexion);
    }
};

module.exports = {
    guardarPedido,
    obtenerPedidos,
    contarPorEstado,
    obtenerDetallePedido,
    cambiarEstadoPedido
};
