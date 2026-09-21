<<<<<<< HEAD
const express = require("express");

const router = express.Router();

const cajeroControlador = require("../controladores/cajeroControlador");



// Mostrar panel cajero

router.get(
    "/",
    cajeroControlador.mostrarPanelCajero
);



// Abrir punto de venta

router.get(
    "/venta",
    (req,res)=>{

        res.sendFile(
            "ventas.html",
            {
                root:"vistas"
            }
        );

    }
);



=======
const express = require('express');
const router = express.Router();
const cajeroControlador = require('../controladores/cajeroControlador');
const { verificarRol } = require('../middlewares/autenticacion');

router.get(
    '/',
    verificarRol('Cajero'),
    cajeroControlador.mostrarPanelCajero
);

>>>>>>> 621afbcd9245e5d2cbb6c8691c0f565ad71ce99e
module.exports = router;