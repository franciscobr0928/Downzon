const tablaProductos = document.getElementById('tabla-productos');

fetch('/productos')
    .then(respuesta => respuesta.json())
    .then(productos => {
        productos.forEach(producto => {
            const fila = document.createElement('tr');

            fila.innerHTML = `
                <td>${producto.id_producto}</td>
                <td>${producto.nombre}</td>
                <td>${producto.descripcion}</td>
                <td>$${parseFloat(producto.precio).toFixed(2)}</td>
                <td>${producto.cantidad}</td>
                <td>
                    <button type="button">Editar</button>
                    <button type="button" onclick="eliminarProducto(${producto.id_producto}, '${producto.nombre}')">
                        Eliminar
                    </button>
                </td>
            `;

            tablaProductos.appendChild(fila);
        });
    })
    .catch(error => {
        console.error(error);

        tablaProductos.innerHTML = `
            <tr>
                <td colspan="6">No se pudieron cargar los productos.</td>
            </tr>
        `;
    });

const eliminarProducto = (id, nombre) => {
    const confirmar = confirm(`¿Seguro que deseas eliminar ${nombre}?`);

    if (!confirmar) {
        return;
    }

    fetch(`/productos/${id}`, {
        method: 'DELETE'
    })
        .then(respuesta => respuesta.json())
        .then(resultado => {
            alert(resultado.mensaje);
            location.reload();
        })
        .catch(error => {
            console.error(error);
            alert('No se pudo eliminar el producto');
        });
};