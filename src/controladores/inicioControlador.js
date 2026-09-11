const path = require('path');

const mostrarInicio = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'inicio.html')
    );
};

module.exports = {
    mostrarInicio
};
