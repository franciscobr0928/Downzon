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
            return res.status(500).send('Error en el servidor');
        }

        if (!usuario) {
            return res.status(401).send('Usuario o contraseña incorrectos');
        }

        req.session.usuario = usuario.username;
        req.session.rol = usuario.rol;

        if (usuario.rol === 'Gerente') {
            return res.redirect('/gerente');
        }

        if (usuario.rol === 'Cajero') {
            return res.redirect('/cajero');
        }

        if (usuario.rol === 'Panadero') {
            return res.redirect('/panadero');
        }

        res.send('Rol no reconocido');
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