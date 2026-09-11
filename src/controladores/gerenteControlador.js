const path = require('path');

const mostrarPanelGerente = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'gerente.html')
    );
};

const mostrarGestionProductos = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'gerenteProductos.html')
    );
};

const mostrarAgregarProducto = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'gerenteAgregarProducto.html')
    );
};

module.exports = {
    mostrarPanelGerente,
    mostrarGestionProductos,
    mostrarAgregarProducto
};