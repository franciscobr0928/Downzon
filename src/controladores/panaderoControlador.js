const path = require('path');

const mostrarPanelPanadero = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'panadero.html')
    );
};

module.exports = {
    mostrarPanelPanadero
};
