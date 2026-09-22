const express = require("express");

const router = express.Router();

const cajeroControlador = require("../controladores/cajeroControlador");

const { verificarRol } = require("../middlewares/autenticacion");



// Mostrar panel cajero

router.get(
    "/",
    verificarRol("Cajero"),
    cajeroControlador.mostrarPanelCajero
);



// Abrir punto de venta

router.get(
    "/venta",
    verificarRol("Cajero"),
    (req,res)=>{

        res.sendFile(
            "ventas.html",
            {
                root:"vistas"
            }
        );

    }
);



module.exports = router;