// Acciones del cajero sobre repartidores y asignación de entregas.
const entregaDAO = require('../dao/entregaDAO');
const usuarioDAO = require('../dao/usuarioDAO');
const { responderError, enteroPositivo } = require('../entidades/pedidos');

const listarRepartidores = async (req, res) => {
    try {
        res.json(await entregaDAO.listarRepartidores());
    } catch (error) {
        responderError(res, error, 'No se pudieron consultar los repartidores.');
    }
};

const asignarRepartidor = async (req, res) => {
    const idPedido = enteroPositivo(req.params.id);
    const idRepartidor = enteroPositivo((req.body || {}).id_repartidor);
    if (!idPedido) return res.status(400).json({ mensaje: 'Pedido no válido.' });
    if (!idRepartidor) return res.status(400).json({ mensaje: 'Selecciona un repartidor.' });
    try {
        const resultado = await entregaDAO.asignarRepartidor(idPedido, idRepartidor);
        res.json({ mensaje: `Pedido #${idPedido} asignado a ${resultado.repartidor}.` });
    } catch (error) {
        responderError(res, error, 'No se pudo asignar el repartidor.');
    }
};

const altaRepartidor = async (req, res) => {
    const datos = req.body || {};
    const texto = valor => typeof valor === 'string' ? valor.trim() : '';
    const nombre = texto(datos.nombre);
    const username = texto(datos.username);
    const password = typeof datos.password === 'string' ? datos.password : '';

    if (!nombre || nombre.length > 100) {
        return res.status(400).json({ mensaje: 'Escribe un nombre de hasta 100 caracteres.' });
    }
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
        return res.status(400).json({ mensaje: 'El usuario debe tener de 3 a 50 caracteres: letras, números, punto, guion o guion bajo.' });
    }
    if (password.length < 4 || password.length > 50) {
        return res.status(400).json({ mensaje: 'La contraseña debe tener de 4 a 50 caracteres.' });
    }
    try {
        const repartidor = await usuarioDAO.crearRepartidor(nombre, username, password);
        res.status(201).json({ mensaje: `Repartidor ${repartidor.nombre} dado de alta.`, repartidor });
    } catch (error) {
        responderError(res, error, 'No se pudo dar de alta al repartidor.');
    }
};

module.exports = { listarRepartidores, asignarRepartidor, altaRepartidor };
