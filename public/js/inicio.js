const contenedorProductos = document.getElementById('productos-contenedor');
const buscadorProductos = document.getElementById('buscador-productos');
const ordenProductos = document.getElementById('orden-productos');
let productosGuardados = [];

const mostrarProductos = (productos) => {
    contenedorProductos.innerHTML = '';
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
                <span>
                    $${parseFloat(producto.precio).toFixed(2)}
                </span>
            </div>
        `;
        contenedorProductos.appendChild(tarjeta);
    });
};

fetch('/productos')
    .then(respuesta => respuesta.json())
    .then(productos => {
        productosGuardados = productos;
        mostrarProductos(productosGuardados);
    })
    .catch(error => {
        console.error(error);
        contenedorProductos.innerHTML = `
            <p>No se pudieron cargar los productos.</p>
        `;
    });

const actualizarProductos = () => {
    const textoBusqueda = buscadorProductos.value.toLowerCase();
    const productosFiltrados = productosGuardados.filter(producto => {
        const nombre = producto.nombre.toLowerCase();
        const descripcion = producto.descripcion
            ? producto.descripcion.toLowerCase()
            : '';
        return (
            nombre.includes(textoBusqueda) ||
            descripcion.includes(textoBusqueda)
        );
    });
    const productosOrdenados = [...productosFiltrados];
    if (ordenProductos.value === 'nombre-asc') {
        productosOrdenados.sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
        );
    }
    if (ordenProductos.value === 'nombre-desc') {
        productosOrdenados.sort((a, b) =>
            b.nombre.localeCompare(a.nombre)
        );
    }
    if (ordenProductos.value === 'precio-asc') {
        productosOrdenados.sort((a, b) =>
            parseFloat(a.precio) - parseFloat(b.precio)
        );
    }
    if (ordenProductos.value === 'precio-desc') {
        productosOrdenados.sort((a, b) =>
            parseFloat(b.precio) - parseFloat(a.precio)
        );
    }
    mostrarProductos(productosOrdenados);
};

buscadorProductos.addEventListener(
    'input',
    actualizarProductos
);

ordenProductos.addEventListener(
    'change',
    actualizarProductos
);