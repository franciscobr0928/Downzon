const ventaDAO = require("../dao/ventaDAO");

exports.registrarVenta = (req, res) => {
  const venta = req.body;

  ventaDAO.crearVenta(
    venta.total,

    (error, idVenta) => {
      if (error) {
        console.log(error);

        res.status(500).json({
          mensaje: "Error creando venta",
        });

        return;
      }

      let contador = 0;

      venta.productos.forEach((producto) => {
        let detalle = {
          id_venta: idVenta,

          id_producto: producto.id_producto,

          cantidad: producto.cantidad,

          subtotal: producto.precio * producto.cantidad,
        };

        ventaDAO.guardarDetalle(
          detalle,

          (error) => {
            if (error) {
              console.log(error);

              return;
            }

            ventaDAO.actualizarInventario(
              producto.id_producto,

              producto.cantidad,

              (error) => {
                if (error) {
                  console.log(error);

                  return;
                }

                contador++;

                if (contador === venta.productos.length) {
                  res.json({
                    mensaje: "Venta guardada correctamente",

                    idVenta: idVenta,
                  });
                }
              },
            );
          },
        );
      });
    },
  );
};

exports.descargarReporteTxt = (req, res) => {
    // Llamamos a una función del DAO para obtener todas las ventas
    // (Asegúrate de tener un método similar a 'obtenerHistorial' en tu ventaDAO)
    ventaDAO.obtenerHistorial((error, ventas) => {
        if (error) {
            console.log(error);
            return res.status(500).send("Error al generar el archivo TXT");
        }

        // Armamos el texto
        let contenidoTxt = "=== REGISTRO DE VENTAS ===\n";
        contenidoTxt += "--------------------------------------------------\n";
        
        let sumaTotal = 0;

        ventas.forEach(venta => {
            // Ajusta "id_venta" y "total" si tus columnas se llaman diferente
            contenidoTxt += `Venta #${venta.id_venta} \t Total: $${venta.total}\n`;
            sumaTotal += parseFloat(venta.total);
        });

        contenidoTxt += "--------------------------------------------------\n";
        contenidoTxt += `TOTAL ACUMULADO: $${sumaTotal.toFixed(2)}\n`;

        // Cabeceras para que el navegador lo descargue como archivo de texto
        res.setHeader('Content-Disposition', 'attachment; filename="Registro_Ventas.txt"');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        // Enviamos el texto
        res.send(contenidoTxt);
    });
};
