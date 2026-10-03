const porId = id => document.getElementById(id);
const formulario = porId('form-pedido');
const selector = porId('producto-pedido');
const tabla = porId('tabla-pedido');
let catalogo = [];
let productosPedido = [];
let enviando = false;
const moneda = valor => Number(valor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

function mostrarMensaje(texto, exito = false) {
    const mensaje = porId('mensaje-pedido');
    mensaje.textContent = texto;
    mensaje.className = exito ? 'mensaje-exito' : 'mensaje-error';
    mensaje.hidden = false;
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function actualizarFechaMinima() {
    const ahora = new Date();
    const dos = n => String(n).padStart(2, '0');
    porId('fecha-entrega').min = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
}

function actualizarEntrega() {
    const domicilio = porId('tipo-entrega').value === 'Domicilio';
    porId('datos-domicilio').hidden = !domicilio;
    porId('direccion').required = domicilio;
    porId('direccion').disabled = !domicilio;
    porId('referencias').disabled = !domicilio;
}

function actualizarTotal() {
    const centavos = productosPedido.reduce((suma, p) =>
        suma + Math.round(Number(p.precio) * 100) * (Number.isInteger(p.cantidad) ? p.cantidad : 0), 0);
    porId('total-pedido').textContent = moneda(centavos / 100);
}

function mostrarProductosPedido() {
    tabla.replaceChildren();
    if (productosPedido.length === 0) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();
        celda.colSpan = 6;
        celda.textContent = 'Agrega los productos que solicita el cliente.';
    }
    productosPedido.forEach(producto => {
        const fila = tabla.insertRow();
        fila.insertCell().textContent = producto.nombre;
        const cantidad = document.createElement('input');
        cantidad.type = 'number';
        cantidad.min = '1';
        cantidad.max = '10000';
        cantidad.step = '1';
        cantidad.required = true;
        cantidad.value = producto.cantidad;
        cantidad.setAttribute('aria-label', `Cantidad de ${producto.nombre}`);
        fila.insertCell().appendChild(cantidad);
        fila.insertCell().textContent = moneda(producto.precio);
        const subtotal = fila.insertCell();
        subtotal.textContent = moneda(producto.precio * producto.cantidad);
        cantidad.addEventListener('input', () => {
            producto.cantidad = cantidad.valueAsNumber;
            subtotal.textContent = cantidad.validity.valid ? moneda(producto.precio * producto.cantidad) : '—';
            actualizarTotal();
        });
        const indicaciones = document.createElement('input');
        indicaciones.type = 'text';
        indicaciones.maxLength = 500;
        indicaciones.value = producto.indicaciones;
        indicaciones.placeholder = 'Ej. sin cubierta, empaque individual';
        indicaciones.setAttribute('aria-label', `Indicaciones para ${producto.nombre}`);
        indicaciones.addEventListener('input', () => { producto.indicaciones = indicaciones.value; });
        fila.insertCell().appendChild(indicaciones);
        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.textContent = 'Quitar';
        quitar.className = 'quitar-producto';
        quitar.setAttribute('aria-label', `Quitar ${producto.nombre}`);
        quitar.addEventListener('click', () => {
            productosPedido = productosPedido.filter(p => p.id_producto !== producto.id_producto);
            mostrarProductosPedido();
        });
        fila.insertCell().appendChild(quitar);
    });
    actualizarTotal();
}

async function leerRespuesta(respuesta) {
    if (respuesta.redirected || respuesta.status === 401) throw new Error('Tu sesión terminó. Vuelve a iniciar sesión.');
    if (respuesta.status === 403) throw new Error('Necesitas iniciar sesión como Cajero.');
    if (!(respuesta.headers.get('content-type') || '').includes('application/json')) {
        throw new Error('El servidor no devolvió una respuesta válida.');
    }
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo completar la operación.');
    return datos;
}

async function cargarCatalogo() {
    try {
        catalogo = await leerRespuesta(await fetch('/productos'));
        selector.replaceChildren(new Option('Selecciona un producto…', ''));
        catalogo.forEach(p => selector.add(new Option(`${p.nombre} — ${moneda(p.precio)}`, p.id_producto)));
        selector.disabled = catalogo.length === 0;
        porId('agregar-producto').disabled = catalogo.length === 0;
        if (!catalogo.length) mostrarMensaje('No hay productos. El gerente debe registrar el catálogo primero.');
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

porId('agregar-producto').addEventListener('click', () => {
    const producto = catalogo.find(p => p.id_producto === Number(selector.value));
    if (!producto) return mostrarMensaje('Selecciona un producto para agregarlo.');
    if (productosPedido.some(p => p.id_producto === producto.id_producto)) {
        return mostrarMensaje('Ese producto ya está agregado. Modifica su cantidad en la tabla.');
    }
    if (productosPedido.length >= 50) return mostrarMensaje('Puedes agregar hasta 50 productos diferentes.');
    productosPedido.push({ ...producto, cantidad: 1, indicaciones: '' });
    mostrarProductosPedido();
    selector.value = '';
});

formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (enviando) return;
    actualizarFechaMinima();
    if (!formulario.reportValidity()) return;
    if (!productosPedido.length) return mostrarMensaje('Agrega al menos un producto al pedido.');
    const datos = {
        nombre_cliente: porId('nombre-cliente').value,
        telefono: porId('telefono').value,
        tipo_entrega: porId('tipo-entrega').value,
        direccion: porId('direccion').value,
        referencias: porId('referencias').value,
        fecha_entrega: porId('fecha-entrega').value,
        notas_preparacion: porId('notas-preparacion').value,
        productos: productosPedido.map(p => ({ id_producto: p.id_producto,
            cantidad: p.cantidad, indicaciones: p.indicaciones }))
    };
    enviando = true;
    porId('campos-pedido').disabled = true;
    porId('guardar-pedido').textContent = 'Guardando…';
    try {
        const resultado = await leerRespuesta(await fetch('/cajero/pedidos/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        }));
        formulario.reset();
        productosPedido = [];
        mostrarProductosPedido();
        actualizarEntrega();
        mostrarMensaje(`Pedido #${resultado.idPedido} registrado. Total: ${moneda(resultado.total)}. Estado: Pendiente.`, true);
    } catch (error) {
        mostrarMensaje(error.message);
    } finally {
        enviando = false;
        porId('campos-pedido').disabled = false;
        porId('guardar-pedido').textContent = 'Registrar pedido';
    }
});

porId('tipo-entrega').addEventListener('change', actualizarEntrega);
actualizarFechaMinima();
actualizarEntrega();
mostrarProductosPedido();
cargarCatalogo();
