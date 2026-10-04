const porId = id => document.getElementById(id);
const moneda = valor => Number(valor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const ESTADOS = ['Pendiente', 'En preparación', 'Terminado', 'Entregado', 'Cancelado'];
const ETIQUETA_ACCION = {
    'En preparación': 'Iniciar preparación',
    'Terminado': 'Marcar terminado',
    'Entregado': 'Marcar entregado',
    'Cancelado': 'Cancelar pedido'
};

let filtro = '';
let busqueda = '';
let pedidos = [];
let conteos = {};
let repartidores = [];
let pedidoAsignando = null;
let ocupado = false;

// Crea nodos con textContent: los datos del cliente nunca se interpretan como HTML.
function crear(etiqueta, { clase, texto, ...atributos } = {}, hijos = []) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    Object.entries(atributos).forEach(([nombre, valor]) => nodo.setAttribute(nombre, valor));
    nodo.append(...hijos);
    return nodo;
}

const claseEstado = estado => estado.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
const insignia = estado => crear('span', { clase: `insignia insignia-${claseEstado(estado)}`, texto: estado });

function mostrarMensaje(texto, exito = false) {
    const mensaje = porId('mensaje');
    mensaje.textContent = texto;
    mensaje.className = `mensaje-estado ${exito ? 'mensaje-exito' : 'mensaje-error'}`;
    mensaje.hidden = false;
    mensaje.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

const enviarJSON = (url, metodo, cuerpo) => fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo)
}).then(leerRespuesta);

/* ---------- Carga de datos ---------- */

async function cargarPedidos() {
    const parametros = new URLSearchParams();
    if (filtro) parametros.set('estado', filtro);
    if (busqueda) parametros.set('q', busqueda);
    const datos = await leerRespuesta(await fetch(`/cajero/api/pedidos?${parametros}`));
    pedidos = datos.pedidos;
    conteos = datos.conteos;
    pintarFiltros();
    pintarPedidos();
}

async function cargarRepartidores() {
    repartidores = await leerRespuesta(await fetch('/cajero/api/repartidores'));
    pintarRepartidores();
}

async function recargar() {
    try {
        await Promise.all([cargarPedidos(), cargarRepartidores()]);
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

/* ---------- Pintado ---------- */

function pintarFiltros() {
    const contenedor = porId('filtros-estado');
    contenedor.replaceChildren();
    const total = ESTADOS.reduce((suma, estado) => suma + (conteos[estado] || 0), 0);
    [['', `Todos (${total})`], ...ESTADOS.map(e => [e, `${e} (${conteos[e] || 0})`])].forEach(([valor, texto]) => {
        const boton = crear('button', { type: 'button', texto, 'aria-pressed': String(filtro === valor) });
        boton.addEventListener('click', () => { filtro = valor; recargar(); });
        contenedor.append(boton);
    });
}

function pintarRepartidores() {
    const lista = porId('lista-repartidores');
    lista.replaceChildren();
    porId('sin-repartidores').hidden = repartidores.length > 0;
    repartidores.forEach(r => {
        const libre = r.disponibilidad === 'Disponible';
        const tarjeta = crear('article', { clase: `tarjeta-repartidor${libre ? '' : ' ocupado'}` }, [
            crear('h3', { texto: r.nombre }),
            crear('p', { clase: 'usuario', texto: `Usuario: ${r.username}` }),
            insignia(r.disponibilidad)
        ]);
        if (!libre) tarjeta.append(crear('p', { clase: 'detalle', texto: `Entregas: ${r.detalle_activas}` }));
        lista.append(tarjeta);
    });
}

function celdaRepartidor(p) {
    const celda = document.createElement('td');
    if (p.tipo_entrega !== 'Domicilio') {
        celda.append(crear('span', { clase: 'secundario', texto: 'No aplica (recoge en sucursal)' }));
    } else if (p.repartidor) {
        celda.append(p.repartidor, crear('span', { clase: 'secundario' }, [insignia(p.estado_entrega)]));
    } else {
        celda.append(crear('span', { clase: 'secundario', texto: 'Sin asignar' }));
    }
    return celda;
}

function celdaAcciones(p) {
    const celda = document.createElement('td');
    const acciones = crear('div', { clase: 'acciones-pedido' });
    const detalle = crear('button', { type: 'button', texto: 'Ver detalle' });
    detalle.addEventListener('click', () => abrirDetalle(p.id_pedido));
    acciones.append(detalle);

    if (p.asignable) {
        const asignar = crear('button', { type: 'button', texto: p.repartidor ? 'Cambiar repartidor' : 'Asignar repartidor' });
        asignar.addEventListener('click', () => abrirAsignacion(p));
        acciones.append(asignar);
    }
    p.estados_siguientes.forEach(estado => {
        const cancelar = estado === 'Cancelado';
        const boton = crear('button', {
            type: 'button',
            clase: cancelar ? 'cancelar' : 'avanzar',
            texto: ETIQUETA_ACCION[estado] || estado
        });
        boton.addEventListener('click', () => cambiarEstado(p, estado));
        acciones.append(boton);
    });
    celda.append(acciones);
    return celda;
}

function pintarPedidos() {
    const cuerpo = porId('tabla-pedidos');
    cuerpo.replaceChildren();
    if (!pedidos.length) {
        const celda = cuerpo.insertRow().insertCell();
        celda.colSpan = 7;
        celda.textContent = filtro || busqueda ? 'No hay pedidos con ese filtro.' : 'Aún no hay pedidos registrados.';
        return;
    }
    pedidos.forEach(p => {
        const fila = cuerpo.insertRow();
        fila.insertCell().append(crear('span', { clase: 'numero', texto: `#${p.id_pedido}` }));
        fila.insertCell().append(p.nombre_cliente, crear('span', { clase: 'secundario', texto: p.telefono }));
        const entrega = fila.insertCell();
        entrega.append(p.tipo_entrega === 'Domicilio' ? 'A domicilio' : 'Recoger en sucursal',
            crear('span', { clase: 'secundario', texto: p.fecha_entrega }));
        if (p.direccion) entrega.append(crear('span', { clase: 'secundario', texto: p.direccion }));
        fila.insertCell().textContent = moneda(p.total);
        fila.insertCell().append(insignia(p.estado));
        fila.append(celdaRepartidor(p), celdaAcciones(p));
    });
}

/* ---------- Acciones ---------- */

async function cambiarEstado(pedido, estado) {
    if (ocupado) return;
    if (estado === 'Cancelado' &&
        !confirm(`¿Cancelar el pedido #${pedido.id_pedido} de ${pedido.nombre_cliente}?`)) return;
    ocupado = true;
    try {
        const resultado = await enviarJSON(`/cajero/api/pedidos/${pedido.id_pedido}/estado`, 'PUT', { estado });
        mostrarMensaje(resultado.mensaje, true);
    } catch (error) {
        mostrarMensaje(error.message);
    } finally {
        ocupado = false;
        await recargar();
    }
}

async function abrirDetalle(idPedido) {
    try {
        const { pedido, productos } = await leerRespuesta(await fetch(`/cajero/api/pedidos/${idPedido}`));
        porId('detalle-titulo').textContent = `Pedido #${pedido.id_pedido}`;
        const datos = [
            ['Estado', insignia(pedido.estado)],
            ['Cliente', pedido.nombre_cliente],
            ['Teléfono', pedido.telefono],
            ['Entrega', pedido.tipo_entrega === 'Domicilio' ? 'A domicilio' : 'Recoger en sucursal'],
            ['Fecha de entrega', pedido.fecha_entrega],
            ['Registrado', pedido.fecha_registro]
        ];
        if (pedido.tipo_entrega === 'Domicilio') {
            datos.push(['Dirección', pedido.direccion || '—'], ['Referencias', pedido.referencias || '—'],
                ['Repartidor', pedido.repartidor ? `${pedido.repartidor} (${pedido.estado_entrega})` : 'Sin asignar']);
        }
        datos.push(['Indicaciones', pedido.notas_preparacion || '—']);
        const lista = crear('dl', { clase: 'dialogo-datos' });
        datos.forEach(([nombre, valor]) => lista.append(crear('dt', { texto: nombre }), crear('dd', {}, [valor])));

        const tabla = crear('table', { clase: 'dialogo-tabla' }, [
            crear('thead', {}, [crear('tr', {}, ['Producto', 'Cant.', 'Subtotal', 'Indicaciones']
                .map(t => crear('th', { texto: t })))]),
            crear('tbody', {}, productos.map(pr => crear('tr', {}, [
                crear('td', { texto: pr.nombre_producto }),
                crear('td', { texto: String(pr.cantidad) }),
                crear('td', { texto: moneda(pr.subtotal) }),
                crear('td', { texto: pr.indicaciones || '—' })
            ])))
        ]);
        porId('detalle-contenido').replaceChildren(lista, crear('div', { clase: 'contenedor-tabla' }, [tabla]),
            crear('p', { clase: 'dialogo-total', texto: `Total: ${moneda(pedido.total)}` }));
        porId('dialogo-detalle').showModal();
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

async function abrirAsignacion(pedido) {
    try {
        await cargarRepartidores(); // disponibilidad al momento
    } catch (error) {
        return mostrarMensaje(error.message);
    }
    if (!repartidores.length) {
        return mostrarMensaje('Primero da de alta al menos un repartidor.');
    }
    pedidoAsignando = pedido;
    porId('asignar-titulo').textContent = `Asignar repartidor al pedido #${pedido.id_pedido}`;
    porId('asignar-resumen').textContent = `${pedido.nombre_cliente} · ${pedido.direccion || ''}`;
    const selector = porId('asignar-repartidor');
    selector.replaceChildren(new Option('Selecciona un repartidor…', ''));
    let disponibles = 0;
    repartidores.forEach(r => {
        const esActual = r.id_usuario === pedido.id_repartidor;
        // Si es el repartidor actual, su única entrega activa es este mismo pedido.
        const libre = r.entregas_activas - (esActual ? 1 : 0) <= 0;
        const texto = esActual ? `${r.nombre} — asignado actualmente`
            : libre ? `${r.nombre} — Disponible` : `${r.nombre} — Ocupado (${r.detalle_activas})`;
        const opcion = new Option(texto, r.id_usuario);
        opcion.disabled = esActual || !libre;
        if (!opcion.disabled) disponibles++;
        selector.add(opcion);
    });
    porId('confirmar-asignar').disabled = disponibles === 0;
    if (!disponibles) {
        porId('asignar-resumen').textContent += ' — Todos los repartidores están ocupados en este momento.';
    }
    porId('dialogo-asignar').showModal();
}

/* ---------- Eventos ---------- */

porId('form-asignar').addEventListener('submit', async evento => {
    evento.preventDefault();
    const idRepartidor = Number(porId('asignar-repartidor').value);
    if (!idRepartidor || !pedidoAsignando || ocupado) return;
    ocupado = true;
    porId('confirmar-asignar').disabled = true;
    try {
        const resultado = await enviarJSON(`/cajero/api/pedidos/${pedidoAsignando.id_pedido}/repartidor`, 'PUT',
            { id_repartidor: idRepartidor });
        porId('dialogo-asignar').close();
        mostrarMensaje(resultado.mensaje, true);
    } catch (error) {
        porId('dialogo-asignar').close();
        mostrarMensaje(error.message);
    } finally {
        ocupado = false;
        pedidoAsignando = null;
        await recargar();
    }
});

porId('form-repartidor').addEventListener('submit', async evento => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const boton = porId('guardar-repartidor');
    if (!formulario.reportValidity()) return;
    boton.disabled = true;
    try {
        const resultado = await enviarJSON('/cajero/api/repartidores', 'POST', {
            nombre: porId('repartidor-nombre').value,
            username: porId('repartidor-usuario').value,
            password: porId('repartidor-password').value
        });
        formulario.reset();
        porId('alta-repartidor').open = false;
        mostrarMensaje(resultado.mensaje, true);
        await cargarRepartidores();
    } catch (error) {
        mostrarMensaje(error.message);
    } finally {
        boton.disabled = false;
    }
});

porId('form-busqueda').addEventListener('submit', evento => {
    evento.preventDefault();
    busqueda = porId('busqueda').value.trim();
    recargar();
});
porId('actualizar').addEventListener('click', recargar);
porId('cerrar-detalle').addEventListener('click', () => porId('dialogo-detalle').close());
porId('cancelar-asignar').addEventListener('click', () => porId('dialogo-asignar').close());

// Seguimiento casi en vivo: se refresca solo si la pestaña está visible y no hay diálogos abiertos.
setInterval(() => {
    if (document.hidden || ocupado || document.querySelector('dialog[open]')) return;
    recargar();
}, 30000);

recargar();
