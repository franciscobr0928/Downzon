const path = require('path');
const usuarioDAO = require('../dao/usuarioDAO');

const mostrarLogin = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'login.html')
    );
};

const iniciarSesion = (req, res) => {
    const { username, password } = req.body;
    usuarioDAO.buscarPorCredenciales(username, password, (error, usuario) => {
        if (error) {
            console.error(error);
            return res.status(500).json({
                mensaje: 'Error en el servidor'
            });
        }
        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }
        req.session.usuario = usuario.username;
        req.session.rol = usuario.rol;
        if (usuario.rol === 'Gerente') {
            return res.json({
                redireccion: '/gerente'
            });
        }
        if (usuario.rol === 'Cajero') {
            return res.json({
                redireccion: '/cajero'
            });
        }
        if (usuario.rol === 'Panadero') {
            return res.json({
                redireccion: '/panadero'
            });
        }
        return res.status(403).json({
            mensaje: 'Rol no reconocido'
        });
    });
};

const cerrarSesion = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/login');
    });
};

module.exports = {
    mostrarLogin,
    iniciarSesion,
    cerrarSesion
};