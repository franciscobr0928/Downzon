const express = require("express");

const router = express.Router();

const ventaControlador =
require("../controladores/ventaControlador");



// Mostrar pantalla de ventas

router.get(
"/",
(req,res)=>{

    res.sendFile(
        "ventas.html",
        {
            root:"vistas"
        }
    );

});




// Registrar venta

router.post(
"/registrar",
ventaControlador.registrarVenta
);



module.exports = router;