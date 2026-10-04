const path = require('path');
const pedidoDAO = require('../dao/pedidoDAO');
const {
    ESTADOS_PEDIDO,
    estadosPermitidosCajero,
    pedidoAsignable,
    responderError,
    enteroPositivo
} = require('../entidades/pedidos');

const mostrarRegistroPedidos = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'cajeroPedidos.html'));
};

const registrarPedido = async (req, res) => {
    const datos = req.body || {};
    const texto = valor => typeof valor === 'string' ? valor.trim() : '';
    const errorDatos = mensaje => res.status(400).json({ mensaje });
    const nombre = texto(datos.nombre_cliente);
    const telefono = texto(datos.telefono);
    const direccion = texto(datos.direccion);
    const referencias = texto(datos.referencias);
    const notas = texto(datos.notas_preparacion);
    const fecha = texto(datos.fecha_entrega);

    if (!Number.isInteger(req.session.idUsuario) || req.session.idUsuario <= 0) {
        return res.status(401).json({ mensaje: 'Vuelve a iniciar sesión para registrar el pedido.' });
    }
    if (!nombre || nombre.length > 100) return errorDatos('Escribe un nombre de hasta 100 caracteres.');
    const digitos = telefono.replace(/\D/g, '');
    if (!/^[\d+()\s-]+$/.test(telefono) || telefono.length > 30 || digitos.length < 7 || digitos.length > 15) {
        return errorDatos('Escribe un teléfono válido de 7 a 15 dígitos.');
    }
    if (!['Recoger', 'Domicilio'].includes(datos.tipo_entrega)) {
        return errorDatos('Selecciona recoger en sucursal o entrega a domicilio.');
    }
    if (datos.tipo_entrega === 'Domicilio' && (!direccion || direccion.length > 255 || referencias.length > 255)) {
        return errorDatos('Indica una dirección; dirección y referencias admiten hasta 255 caracteres cada una.');
    }
    if (notas.length > 1000) return errorDatos('Las indicaciones generales admiten hasta 1000 caracteres.');

    // datetime-local usa la hora local del servidor, sin conversión a UTC.
    const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(fecha);
    if (!partes) return errorDatos('Selecciona una fecha y hora de entrega válidas.');
    const [anio, mes, dia, hora, minuto] = partes.slice(1).map(Number);
    const entrega = new Date(anio, mes - 1, dia, hora, minuto);
    const ahora = new Date();
    ahora.setSeconds(0, 0);
    if (entrega.getFullYear() !== anio || entrega.getMonth() !== mes - 1 ||
        entrega.getDate() !== dia || entrega.getHours() !== hora ||
        entrega.getMinutes() !== minuto || entrega < ahora) {
        return errorDatos('La fecha debe existir y no puede ser anterior a la fecha y hora actuales.');
    }
    if (!Array.isArray(datos.productos) || datos.productos.length === 0 || datos.productos.length > 50) {
        return errorDatos('Agrega entre 1 y 50 productos al pedido.');
    }
    const productos = [];
    const ids = new Set();
    for (const item of datos.productos) {
        if (!item || !Number.isInteger(item.id_producto) || item.id_producto <= 0 ||
            !Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 10000 ||
            texto(item.indicaciones).length > 500 || ids.has(item.id_producto)) {
            return errorDatos('Revisa los productos: sin duplicados, cantidades enteras de 1 a 10000 e indicaciones de hasta 500 caracteres.');
        }
        ids.add(item.id_producto);
        productos.push({ id_producto: item.id_producto, cantidad: item.cantidad,
            indicaciones: texto(item.indicaciones) });
    }
    try {
        const resultado = await pedidoDAO.guardarPedido({
            id_usuario: req.session.idUsuario, nombre_cliente: nombre, telefono,
            tipo_entrega: datos.tipo_entrega,
            direccion: datos.tipo_entrega === 'Domicilio' ? direccion : null,
            referencias: datos.tipo_entrega === 'Domicilio' ? referencias || null : null,
            fecha_entrega: fecha.replace('T', ' ') + ':00',
            notas_preparacion: notas, productos
        });
        return res.status(201).json({ mensaje: 'Pedido registrado correctamente.', ...resultado });
    } catch (error) {
        console.error('Error al registrar pedido:', error.message);
        return res.status(error.status || 500).json({
            mensaje: error.status === 400 ? error.message : 'No se pudo guardar el pedido. Revisa la conexión y las tablas de pedidos.'
        });
    }
};

const mostrarVisualizarPedidos = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'cajeroVisualizarPedidos.html'));
};

// Agrega al pedido las acciones que el cajero puede hacer sobre él.
const conAcciones = pedido => ({
    ...pedido,
    estados_siguientes: estadosPermitidosCajero(pedido.estado, pedido.tipo_entrega),
    asignable: pedidoAsignable(pedido.estado, pedido.tipo_entrega) &&
        (!pedido.estado_entrega || pedido.estado_entrega === 'Pendiente')
});

const listarPedidos = async (req, res) => {
    const estado = typeof req.query.estado === 'string' ? req.query.estado : '';
    if (estado && !ESTADOS_PEDIDO.includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado de pedido no válido.' });
    }
    const busqueda = (typeof req.query.q === 'string' ? req.query.q.trim() : '').slice(0, 100);
    try {
        const [pedidos, conteos] = await Promise.all([
            pedidoDAO.obtenerPedidos({ estado, busqueda }),
            pedidoDAO.contarPorEstado()
        ]);
        const totales = Object.fromEntries(ESTADOS_PEDIDO.map(e => [e, 0]));
        conteos.forEach(fila => { if (fila.estado in totales) totales[fila.estado] = fila.total; });
        res.json({ pedidos: pedidos.map(conAcciones), conteos: totales });
    } catch (error) {
        responderError(res, error, 'No se pudieron consultar los pedidos.');
    }
};

const obtenerDetallePedido = async (req, res) => {
    const idPedido = enteroPositivo(req.params.id);
    if (!idPedido) return res.status(400).json({ mensaje: 'Pedido no válido.' });
    try {
        const detalle = await pedidoDAO.obtenerDetallePedido(idPedido);
        if (!detalle) return res.status(404).json({ mensaje: 'El pedido no existe.' });
        res.json({ pedido: conAcciones(detalle.pedido), productos: detalle.productos });
    } catch (error) {
        responderError(res, error, 'No se pudo consultar el pedido.');
    }
};

const cambiarEstadoPedido = async (req, res) => {
    const idPedido = enteroPositivo(req.params.id);
    const estado = (req.body || {}).estado;
    if (!idPedido) return res.status(400).json({ mensaje: 'Pedido no válido.' });
    if (!ESTADOS_PEDIDO.includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado de pedido no válido.' });
    }
    try {
        await pedidoDAO.cambiarEstadoPedido(idPedido, estado);
        res.json({ mensaje: `Pedido #${idPedido} actualizado a "${estado}".` });
    } catch (error) {
        responderError(res, error, 'No se pudo actualizar el estado del pedido.');
    }
};

module.exports = {
    mostrarRegistroPedidos,
    registrarPedido,
    mostrarVisualizarPedidos,
    listarPedidos,
    obtenerDetallePedido,
    cambiarEstadoPedido
};
