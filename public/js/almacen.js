window.onload = function () {
    cargarInventario();
    cargarIngredientes();
    cargarEntradas();
    cargarSalidas();
    cargarEstadisticas();
    document.getElementById("ingrediente")
    .addEventListener("change", function () {
        let unidad =
        this.options[this.selectedIndex]
        .getAttribute("data-unidad");
        document.getElementById("unidad").value = unidad;
    });
};

function cargarInventario() {
    fetch('/gerente/almacen/inventario')
        .then(res => res.json())
        .then(datos => {
            let tabla =
                document.getElementById("tablaInventario");
            tabla.innerHTML = "";
            datos.forEach(item => {
                tabla.innerHTML += `
            <tr>
                <td>${item.ingrediente}</td>
                <td>${item.stock_actual}</td>
                <td>${item.unidad}</td>
                <td>${item.estado}</td>
                <td>
                <button class="boton-eliminar" onclick="retirarStock(${item.id_inventario})">
                Retirar
                </button>
                </td>
            </tr>
            `;
            });
        });
}

function retirarStock(id){
    let cantidad = prompt("Cantidad a retirar:");
    if(cantidad == null || cantidad <= 0){
        return;
    }
    fetch('/gerente/almacen/salida',{
        method:'PUT',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            id_inventario:id,
            cantidad:Number(cantidad)
        })
    })
    .then(res=>res.json())
    .then(data=>{
        alert(data.mensaje);
        cargarInventario();
        cargarSalidas();
        cargarEstadisticas();
    })
    .catch(error=>{
        console.log(error);
    });
}

function cargarIngredientes(){
    fetch('/gerente/almacen/inventario')
    .then(res=>res.json())
    .then(datos=>{
        let select = document.getElementById("ingrediente");
        datos.forEach(item=>{
            select.innerHTML += `
            <option value="${item.id_inventario}" data-unidad="${item.unidad}">
            ${item.ingrediente}
            </option>
            `;
        });
    });
}

function registrarEntrada(){
    let id_inventario = document.getElementById("ingrediente").value;
    let cantidad = Number(document.getElementById("cantidad").value);
    let unidad = document.getElementById("unidad").value;
    let fecha = document.getElementById("fechaEntrada").value;
    fetch('/gerente/almacen/entrada',{
        method:'PUT', headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            id_inventario,
            cantidad,
            unidad,
            fecha
        })
    })
    .then(res=>res.json())
    .then(data=>{
        alert(data.mensaje);
        cargarInventario();
        cargarEntradas();
        cargarEstadisticas();
    });
}
function cargarEntradas() {
    fetch('/gerente/almacen/entradas')
        .then(res => res.json())
        .then(datos => {
            let tabla = document.getElementById("tablaEntradas");
            tabla.innerHTML = "";
            datos.forEach(item => {
                tabla.innerHTML += `
                    <tr>
                        <td>${new Date(item.fecha).toLocaleDateString('es-MX')}</td>
                        <td>${item.ingrediente}</td>
                        <td>${item.cantidad} ${item.unidad}</td>
                    </tr>
                `;
            });
        });
}

function cargarSalidas() {
    fetch('/gerente/almacen/salidas')
        .then(res => res.json())
        .then(datos => {
            let tabla = document.getElementById("tablaSalidas");

            tabla.innerHTML = "";

            datos.forEach(item => {
                tabla.innerHTML += `
                    <tr>
                        <td>${new Date(item.fecha).toLocaleDateString('es-MX')}</td>
                        <td>${item.ingrediente}</td>
                        <td>${item.cantidad} ${item.unidad}</td>
                    </tr>
                `;
            });
        });
}

function cargarEstadisticas() {
    fetch('/gerente/almacen/estadisticas')
        .then(res => res.json())
        .then(datos => {
            document.getElementById("totalIngredientes").innerHTML = datos.totalIngredientes;
            document.getElementById("entradasMes").innerHTML = datos.entradasMes;
            document.getElementById("salidas").innerHTML = datos.salidas;
            document.getElementById("stockBajo").innerHTML = datos.stockBajo;
        });
}

document.getElementById("buscarIngrediente").addEventListener("keyup", function() {
    let texto = this.value.toLowerCase();
    let filas = document.querySelectorAll("#tablaInventario tr");
    filas.forEach(fila => {
        let ingrediente = fila.children[0].textContent.toLowerCase();
        if (ingrediente.includes(texto)) {
            fila.style.display = "";
        } else {
            fila.style.display = "none";
        }
    });
});