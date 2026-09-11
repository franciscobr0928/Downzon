const contenedorProductos = document.getElementById('productos-contenedor');

fetch('/productos')
    .then(respuesta => respuesta.json())
    .then(productos => {
        productos.forEach(producto => {
            const tarjeta = document.createElement('article');

            tarjeta.classList.add('producto');

            const imagen = producto.imagen
                ? `<img src="/img/productos/${producto.imagen}" alt="${producto.nombre}" class="producto-imagen">`
                : '';

            tarjeta.innerHTML = `
                ${imagen}

                <div class="producto-informacion">
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion}</p>
                    <span>$${parseFloat(producto.precio).toFixed(2)}</span>
                </div>
            `;

            contenedorProductos.appendChild(tarjeta);
        });
    })
    .catch(error => {
        console.error(error);

        contenedorProductos.innerHTML = `
            <p>No se pudieron cargar los productos.</p>
        `;
    });
