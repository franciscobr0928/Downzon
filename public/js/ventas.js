let carrito = [];



window.onload = function () {

    cargarProductos();

};





function cargarProductos() {


    fetch("/productos")

        .then(res => res.json())

        .then(productos => {
            let contenedor = document.getElementById("productos");
            contenedor.innerHTML = "";

            productos.forEach(producto => {


                contenedor.innerHTML += `


        <div class="producto-card">


            <h3>
                ${producto.nombre}
            </h3>



            <p>
            Precio:
            $${producto.precio}
            </p>


            <p>
            Stock disponible:
            <b>${producto.cantidad}</b>
            </p>



            <button 
            onclick='agregarProducto(${JSON.stringify(producto)})'>


                Agregar al carrito


            </button>



        </div>


        `;



            });



        });


}






function agregarProducto(producto) {


    let existe = carrito.find(
        p => p.id_producto == producto.id_producto
    );



    if (existe) {


        if (existe.cantidadVenta < producto.cantidad) {


            existe.cantidadVenta++;


        } else {


            alert("No hay más productos disponibles");


        }



    } else {


        producto.cantidadVenta = 1;


        carrito.push(producto);


    }



    mostrarCarrito();


}







function mostrarCarrito() {


    let tabla =
        document.getElementById("carrito");



    tabla.innerHTML = "";



    let total = 0;




    carrito.forEach(producto => {


        let subtotal =
            producto.precio *
            producto.cantidadVenta;



        total += subtotal;



        tabla.innerHTML += `


    <tr>


        <td>
            ${producto.nombre}
        </td>



        <td>
        ${producto.cantidadVenta}
        </td>



        <td>
            $${producto.precio}
        </td>



        <td>
            $${subtotal}
        </td>


    </tr>


    `;


    });




    document.getElementById("total")
        .innerHTML = total;



    calcularCambio();



}








function calcularCambio() {



    let pago =

        Number(
            document.getElementById("pago").value
        );



    let total =

        Number(
            document.getElementById("total").innerHTML
        );



    let cambio = pago - total;



    document.getElementById("cambio")
        .innerHTML = cambio;



}







function finalizarVenta() {


    console.log("ENTRO A FINALIZAR VENTA");


    if (carrito.length == 0) {


        alert("No hay productos en la venta");

        return;


    }



    let total =

        Number(
            document.getElementById("total").innerHTML
        );



    console.log("CARrito:", carrito);

    console.log("TOTAL:", total);



    fetch("/ventas/registrar",
        {


            method: "POST",


            headers: {


                "Content-Type": "application/json"


            },


            body: JSON.stringify({


                total: total,


                productos: carrito.map(producto => ({
                    id_producto: producto.id_producto,
                    precio: producto.precio,
                    cantidad: producto.cantidadVenta

                }))


            })


        })


        .then(res => {


            console.log("Respuesta servidor:", res.status);


            return res.json();


        })


        .then(data => {


            console.log("Datos recibidos:", data);


            alert(data.mensaje);



            carrito = [];



            mostrarCarrito();
            cargarProductos();



            document.getElementById("pago").value = "";



        })


        .catch(error => {


            console.log("ERROR FETCH:", error);


            alert("Error al registrar venta");


        });



}