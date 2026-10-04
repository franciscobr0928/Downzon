// Reglas compartidas de pedidos y entregas (una sola fuente de verdad
// para el servidor; el navegador recibe ya calculadas las acciones válidas).

const ESTADOS_PEDIDO = ['Pendiente', 'En preparación', 'Terminado', 'Entregado', 'Cancelado'];
const ESTADOS_ENTREGA = ['Pendiente', 'En camino', 'Entregada'];

// Estados de entrega que mantienen ocupado a un repartidor.
const ESTADOS_ENTREGA_ACTIVA = ['Pendiente', 'En camino'];

const TRANSICIONES_PEDIDO = {
    'Pendiente': ['En preparación', 'Cancelado'],
    'En preparación': ['Terminado', 'Cancelado'],
    'Terminado': ['Entregado', 'Cancelado'],
    'Entregado': [],
    'Cancelado': []
};

// Estados que el cajero puede aplicar. En pedidos a domicilio el estado
// "Entregado" lo fija el repartidor al marcar su entrega como entregada.
const estadosPermitidosCajero = (estadoActual, tipoEntrega) => {
    const siguientes = TRANSICIONES_PEDIDO[estadoActual] || [];
    return tipoEntrega === 'Domicilio'
        ? siguientes.filter(estado => estado !== 'Entregado')
        : siguientes;
};

const pedidoAsignable = (estado, tipoEntrega) =>
    tipoEntrega === 'Domicilio' && !['Entregado', 'Cancelado'].includes(estado);

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const responderError = (res, error, mensajeGenerico) => {
    if (error && error.status) {
        return res.status(error.status).json({ mensaje: error.message });
    }
    console.error(error);
    return res.status(500).json({ mensaje: mensajeGenerico });
};

// Convierte "12" en 12; cualquier otra cosa devuelve null.
const enteroPositivo = valor => {
    const texto = String(valor);
    return /^\d{1,10}$/.test(texto) && Number(texto) > 0 ? Number(texto) : null;
};

module.exports = {
    ESTADOS_PEDIDO,
    ESTADOS_ENTREGA,
    ESTADOS_ENTREGA_ACTIVA,
    TRANSICIONES_PEDIDO,
    estadosPermitidosCajero,
    pedidoAsignable,
    errorHttp,
    responderError,
    enteroPositivo
};
