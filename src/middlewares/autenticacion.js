const verificarRol = (rolPermitido) => {
    return (req, res, next) => {

        if (!req.session.usuario) {
            return res.redirect('/login');
        }

        if (req.session.rol !== rolPermitido) {
            return res.status(403).send('No tienes permiso para acceder a esta página');
        }

        next();
    };
};

module.exports = {
    verificarRol
};