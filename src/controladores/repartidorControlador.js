// Panel del repartidor: solo ve y modifica SUS entregas (id de la sesión).
const path = require('path');
const entregaDAO = require('../dao/entregaDAO');
const { responderError, enteroPositivo } = require('../entidades/pedidos');

const mostrarPanelRepartidor = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'vistas', 'repartidor.html'));
};

const obtenerPerfil = (req, res) => {
    res.json({ nombre: req.session.nombre || req.session.usuario });
};

const listarMisEntregas = async (req, res) => {
    try {
        res.json(await entregaDAO.obtenerEntregasDeRepartidor(req.session.idUsuario));
    } catch (error) {
        responderError(res, error, 'No se pudieron consultar tus entregas.');
    }
};

const actualizarEstadoEntrega = async (req, res) => {
    const idEntrega = enteroPositivo(req.params.id);
    const estado = (req.body || {}).estado;
    if (!idEntrega) return res.status(400).json({ mensaje: 'Entrega no válida.' });
    if (!['En camino', 'Entregada'].includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado de entrega no válido.' });
    }
    try {
        await entregaDAO.actualizarEstadoEntrega(idEntrega, req.session.idUsuario, estado);
        res.json({ mensaje: estado === 'En camino'
            ? 'Entrega marcada como en camino.'
            : 'Entrega marcada como entregada.' });
    } catch (error) {
        responderError(res, error, 'No se pudo actualizar la entrega.');
    }
};

module.exports = {
    mostrarPanelRepartidor,
    obtenerPerfil,
    listarMisEntregas,
    actualizarEstadoEntrega
};
