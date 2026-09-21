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



module.exports = router;