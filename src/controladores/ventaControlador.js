const ventaDAO = require("../dao/ventaDAO");



exports.registrarVenta = (req,res)=>{


    const venta = req.body;



    ventaDAO.crearVenta(

        venta.total,


        (error,idVenta)=>{


            if(error){

                console.log(error);

                res.status(500).json({
                    mensaje:"Error creando venta"
                });

                return;

            }



            let contador = 0;



            venta.productos.forEach(producto=>{


                let detalle={


                    id_venta:idVenta,

                    id_producto:
                    producto.id_producto,

                    cantidad:
                    producto.cantidad,

                    subtotal:
                    producto.precio *
                    producto.cantidad


                };




                ventaDAO.guardarDetalle(

                    detalle,


                    (error)=>{


                        if(error){

                            console.log(error);

                            return;

                        }




                        ventaDAO.actualizarInventario(

                            producto.id_producto,

                            producto.cantidad,


                            (error)=>{


                                if(error){

                                    console.log(error);

                                    return;

                                }



                                contador++;



                                if(
                                contador === venta.productos.length
                                ){


                                    res.json({

                                        mensaje:
                                        "Venta guardada correctamente",

                                        idVenta:idVenta

                                    });


                                }



                            }


                        );

                    }


                );



            });



        }


    );


};