const conexion = require("../base_de_datos/conexion");


// Crear venta
exports.crearVenta = (total, callback) => {

    const sql = `
        INSERT INTO ventas(total)
        VALUES(?)
    `;


    conexion.query(
        sql,
        [total],
        (error, resultado)=>{


            if(error){

                callback(error,null);
                return;

            }


            callback(null,resultado.insertId);


        }
    );

};




// Guardar detalle de venta
exports.guardarDetalle = (detalle, callback)=>{


    const sql = `
        INSERT INTO detalle_venta
        (
            id_venta,
            id_producto,
            cantidad,
            subtotal
        )
        VALUES(?,?,?,?)
    `;



    conexion.query(

        sql,

        [
            detalle.id_venta,
            detalle.id_producto,
            detalle.cantidad,
            detalle.subtotal
        ],


        (error,resultado)=>{


            callback(error,resultado);


        }


    );


};




// Actualizar inventario
exports.actualizarInventario = (id_producto,cantidad,callback)=>{


    const sql = `
        UPDATE productos
        SET cantidad = cantidad - ?
        WHERE id_producto = ?
    `;



    conexion.query(

        sql,

        [
            cantidad,
            id_producto
        ],


        (error,resultado)=>{


            callback(error,resultado);


        }


    );

};


exports.obtenerVentas = (callback)=>{


    const sql = `

    SELECT * FROM ventas

    ORDER BY id_venta DESC

    `;



    conexion.query(
        sql,
        (error,resultados)=>{


            callback(error,resultados);


        }
    );


};