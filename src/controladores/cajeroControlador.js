const path = require('path');

const mostrarPanelCajero = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'cajero.html')
    );
};

module.exports = {
    mostrarPanelCajero
};
