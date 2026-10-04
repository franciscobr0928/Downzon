const conexionBase = require('../base_de_datos/conexion');
const {
    ESTADOS_ENTREGA_ACTIVA,
    errorHttp,
    pedidoAsignable
} = require('../entidades/pedidos');

const consultar = (sql, parametros = []) =>
    conexionBase.promise().query(sql, parametros).then(([filas]) => filas);

const cerrar = conexion => conexion.end().catch(error => {
    console.error('Error al cerrar conexión:', error.message);
});

// Repartidores activos con su disponibilidad. Un repartidor está ocupado
// mientras tenga alguna entrega Pendiente o En camino.
const listarRepartidores = async () => {
    const filas = await consultar(
        `SELECT u.id_usuario, u.nombre, u.username,
                COUNT(e.id_entrega) AS entregas_activas,
                GROUP_CONCAT(CONCAT('#', e.id_pedido, ' (', e.estado, ')')
                             ORDER BY e.id_pedido SEPARATOR ', ') AS detalle_activas
         FROM usuarios u
         LEFT JOIN entregas e ON e.id_repartidor = u.id_usuario
              AND e.estado IN (?)
         WHERE u.rol = 'Repartidor' AND u.activo = TRUE
         GROUP BY u.id_usuario, u.nombre, u.username
         ORDER BY u.nombre`,
        [ESTADOS_ENTREGA_ACTIVA]
    );
    return filas.map(fila => ({
        ...fila,
        disponibilidad: fila.entregas_activas > 0 ? 'Ocupado' : 'Disponible'
    }));
};

// Asigna (o reasigna, mientras la entrega siga Pendiente) un repartidor.
// El repartidor se bloquea con FOR UPDATE: dos asignaciones simultáneas al
// mismo empleado se ejecutan una tras otra y la segunda ve que ya está ocupado.
const asignarRepartidor = async (idPedido, idRepartidor) => {
    const conexion = await conexionBase.crearConexion();
    try {
        await conexion.beginTransaction();

        const [pedidos] = await conexion.query(
            'SELECT estado, tipo_entrega FROM pedidos WHERE id_pedido = ? FOR UPDATE',
            [idPedido]
        );
        if (!pedidos.length) throw errorHttp(404, 'El pedido no existe.');
        if (pedidos[0].tipo_entrega !== 'Domicilio') {
            throw errorHttp(400, 'Solo los pedidos a domicilio llevan repartidor.');
        }
        if (!pedidoAsignable(pedidos[0].estado, pedidos[0].tipo_entrega)) {
            throw errorHttp(409, `Un pedido ${pedidos[0].estado.toLowerCase()} ya no admite repartidor.`);
        }

        const [repartidores] = await conexion.query(
            `SELECT id_usuario, nombre FROM usuarios
             WHERE id_usuario = ? AND rol = 'Repartidor' AND activo = TRUE FOR UPDATE`,
            [idRepartidor]
        );
        if (!repartidores.length) throw errorHttp(400, 'El repartidor seleccionado no existe o está inactivo.');

        const [entregas] = await conexion.query(
            'SELECT id_entrega, id_repartidor, estado FROM entregas WHERE id_pedido = ? FOR UPDATE',
            [idPedido]
        );
        const entrega = entregas[0];
        if (entrega && entrega.estado !== 'Pendiente') {
            throw errorHttp(409, `La entrega ya está "${entrega.estado}" y no se puede reasignar.`);
        }
        if (entrega && entrega.id_repartidor === idRepartidor) {
            throw errorHttp(409, 'Ese repartidor ya tiene asignado este pedido.');
        }

        const [ocupado] = await conexion.query(
            'SELECT id_pedido FROM entregas WHERE id_repartidor = ? AND estado IN (?) AND id_pedido <> ? LIMIT 1',
            [idRepartidor, ESTADOS_ENTREGA_ACTIVA, idPedido]
        );
        if (ocupado.length) {
            throw errorHttp(409, `${repartidores[0].nombre} está ocupado con el pedido #${ocupado[0].id_pedido}.`);
        }

        if (entrega) {
            await conexion.query(
                'UPDATE entregas SET id_repartidor = ?, fecha_asignacion = NOW() WHERE id_entrega = ?',
                [idRepartidor, entrega.id_entrega]
            );
        } else {
            await conexion.query(
                'INSERT INTO entregas (id_pedido, id_repartidor) VALUES (?, ?)',
                [idPedido, idRepartidor]
            );
        }
        await conexion.commit();
        return { id_pedido: idPedido, id_repartidor: idRepartidor, repartidor: repartidores[0].nombre };
    } catch (error) {
        await conexion.rollback().catch(() => {});
        if (error.code === 'ER_DUP_ENTRY') {
            throw errorHttp(409, 'Ese pedido acaba de ser asignado por otra persona. Recarga la lista.');
        }
        throw error;
    } finally {
        await cerrar(conexion);
    }
};

// Entregas de UN repartidor (el filtro por id_repartidor es obligatorio).
const obtenerEntregasDeRepartidor = async idRepartidor => {
    const entregas = await consultar(
        `SELECT e.id_entrega, e.id_pedido, e.estado,
                DATE_FORMAT(e.fecha_asignacion, '%Y-%m-%d %H:%i') AS fecha_asignacion,
                DATE_FORMAT(e.fecha_salida, '%Y-%m-%d %H:%i') AS fecha_salida,
                DATE_FORMAT(e.fecha_entregada, '%Y-%m-%d %H:%i') AS fecha_entregada,
                p.nombre_cliente, p.telefono, p.direccion, p.referencias,
                p.notas_preparacion, p.total, p.estado AS estado_pedido,
                DATE_FORMAT(p.fecha_entrega, '%Y-%m-%d %H:%i') AS fecha_entrega
         FROM entregas e
         JOIN pedidos p ON p.id_pedido = e.id_pedido
         WHERE e.id_repartidor = ?
         ORDER BY (e.estado = 'Entregada'), p.fecha_entrega ASC
         LIMIT 100`,
        [idRepartidor]
    );
    if (!entregas.length) return [];
    const productos = await consultar(
        `SELECT id_pedido, nombre_producto, cantidad, indicaciones
         FROM detalle_pedido WHERE id_pedido IN (?) ORDER BY id_detalle_pedido`,
        [entregas.map(e => e.id_pedido)]
    );
    return entregas.map(entrega => ({
        ...entrega,
        productos: productos.filter(p => p.id_pedido === entrega.id_pedido)
    }));
};

// Avance de estado por el repartidor dueño de la entrega:
//   Pendiente -> En camino (el pedido debe estar Terminado)
//   En camino -> Entregada (el pedido pasa a Entregado)
const actualizarEstadoEntrega = async (idEntrega, idRepartidor, nuevoEstado) => {
    const conexion = await conexionBase.crearConexion();
    try {
        await conexion.beginTransaction();

        // Se bloquea primero el pedido (mismo orden que el resto de operaciones).
        const [propias] = await conexion.query(
            'SELECT id_pedido FROM entregas WHERE id_entrega = ? AND id_repartidor = ?',
            [idEntrega, idRepartidor]
        );
        if (!propias.length) throw errorHttp(404, 'No tienes asignada esa entrega.');
        const idPedido = propias[0].id_pedido;

        const [pedidos] = await conexion.query(
            'SELECT estado FROM pedidos WHERE id_pedido = ? FOR UPDATE', [idPedido]
        );
        const [entregas] = await conexion.query(
            'SELECT estado FROM entregas WHERE id_entrega = ? AND id_repartidor = ? FOR UPDATE',
            [idEntrega, idRepartidor]
        );
        if (!pedidos.length || !entregas.length) throw errorHttp(404, 'No tienes asignada esa entrega.');
        const estadoActual = entregas[0].estado;

        if (nuevoEstado === 'En camino') {
            if (estadoActual !== 'Pendiente') {
                throw errorHttp(409, `La entrega ya está "${estadoActual}".`);
            }
            if (pedidos[0].estado !== 'Terminado') {
                throw errorHttp(409, `El pedido aún está "${pedidos[0].estado}". Podrás salir cuando esté Terminado.`);
            }
            await conexion.query(
                "UPDATE entregas SET estado = 'En camino', fecha_salida = NOW() WHERE id_entrega = ?",
                [idEntrega]
            );
        } else if (nuevoEstado === 'Entregada') {
            if (estadoActual !== 'En camino') {
                throw errorHttp(409, estadoActual === 'Entregada'
                    ? 'Esta entrega ya fue marcada como entregada.'
                    : 'Primero marca la entrega como "En camino".');
            }
            await conexion.query(
                "UPDATE entregas SET estado = 'Entregada', fecha_entregada = NOW() WHERE id_entrega = ?",
                [idEntrega]
            );
            await conexion.query(
                "UPDATE pedidos SET estado = 'Entregado' WHERE id_pedido = ?", [idPedido]
            );
        } else {
            throw errorHttp(400, 'Estado de entrega no válido.');
        }
        await conexion.commit();
        return { id_entrega: idEntrega, id_pedido: idPedido, estado: nuevoEstado };
    } catch (error) {
        await conexion.rollback().catch(() => {});
        throw error;
    } finally {
        await cerrar(conexion);
    }
};

module.exports = {
    listarRepartidores,
    asignarRepartidor,
    obtenerEntregasDeRepartidor,
    actualizarEstadoEntrega
};
