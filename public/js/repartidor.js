const porId = id => document.getElementById(id);
const moneda = valor => Number(valor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

let entregas = [];
let verEntregadas = false;
let ocupado = false;

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
    if (respuesta.status === 403) throw new Error('Necesitas iniciar sesión como Repartidor.');
    if (!(respuesta.headers.get('content-type') || '').includes('application/json')) {
        throw new Error('El servidor no devolvió una respuesta válida.');
    }
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo completar la operación.');
    return datos;
}

function tarjeta(entrega) {
    const dato = (nombre, valor) => [crear('dt', { texto: nombre }), crear('dd', {}, [valor])];
    const telefono = crear('a', { href: `tel:${entrega.telefono.replace(/[^\d+]/g, '')}`, texto: entrega.telefono });
    const datos = crear('dl', { clase: 'datos-entrega' });
    datos.append(
        ...dato('Teléfono', telefono),
        ...dato('Dirección', entrega.direccion || '—'),
        ...dato('Referencias', entrega.referencias || '—'),
        ...dato('Entregar el', entrega.fecha_entrega),
        ...dato('Total del pedido', moneda(entrega.total)),
        ...dato('Indicaciones', entrega.notas_preparacion || '—')
    );
    if (entrega.fecha_salida) datos.append(...dato('Salida', entrega.fecha_salida));
    if (entrega.fecha_entregada) datos.append(...dato('Entregada', entrega.fecha_entregada));

    const productos = crear('ul', { clase: 'productos-entrega' }, entrega.productos.map(p => {
        const item = crear('li', { texto: `${p.cantidad} × ${p.nombre_producto}` });
        if (p.indicaciones) item.append(crear('span', { clase: 'nota', texto: ` — ${p.indicaciones}` }));
        return item;
    }));

    const nodo = crear('article', { clase: `tarjeta-entrega ${claseEstado(entrega.estado)}` }, [
        crear('div', { clase: 'entrega-cabecera' }, [
            crear('div', {}, [
                crear('h2', { texto: `Pedido #${entrega.id_pedido}` }),
                crear('p', { clase: 'cliente', texto: entrega.nombre_cliente })
            ]),
            insignia(entrega.estado)
        ]),
        datos,
        productos
    ]);

    const acciones = crear('div', { clase: 'acciones-entrega' });
    if (entrega.estado === 'Pendiente') {
        const listo = entrega.estado_pedido === 'Terminado';
        if (!listo) {
            nodo.append(crear('p', { clase: 'aviso-entrega',
                texto: `El pedido aún está "${entrega.estado_pedido}". Podrás salir cuando esté Terminado.` }));
        }
        const salir = crear('button', { type: 'button', clase: 'boton-guardar', texto: 'Salir a entregar (En camino)' });
        salir.disabled = !listo;
        salir.addEventListener('click', () => actualizar(entrega, 'En camino'));
        acciones.append(salir);
    } else if (entrega.estado === 'En camino') {
        const entregada = crear('button', { type: 'button', clase: 'boton-guardar', texto: 'Marcar como entregada' });
        entregada.addEventListener('click', () => {
            if (confirm(`¿Confirmas que entregaste el pedido #${entrega.id_pedido} a ${entrega.nombre_cliente}?`)) {
                actualizar(entrega, 'Entregada');
            }
        });
        acciones.append(entregada);
    }
    if (acciones.children.length) nodo.append(acciones);
    return nodo;
}

function pintar() {
    const activas = entregas.filter(e => e.estado !== 'Entregada');
    const hechas = entregas.filter(e => e.estado === 'Entregada');
    porId('filtro-activas').textContent = `Por entregar (${activas.length})`;
    porId('filtro-entregadas').textContent = `Entregadas (${hechas.length})`;
    porId('filtro-activas').setAttribute('aria-pressed', String(!verEntregadas));
    porId('filtro-entregadas').setAttribute('aria-pressed', String(verEntregadas));

    const lista = porId('lista-entregas');
    const visibles = verEntregadas ? hechas : activas;
    lista.replaceChildren();
    if (!visibles.length) {
        lista.append(crear('p', { clase: 'entrega-vacia', texto: verEntregadas
            ? 'Todavía no has completado entregas.'
            : 'No tienes entregas pendientes. Cuando el cajero te asigne una, aparecerá aquí.' }));
        return;
    }
    visibles.forEach(entrega => lista.append(tarjeta(entrega)));
}

async function cargarEntregas() {
    try {
        entregas = await leerRespuesta(await fetch('/repartidor/api/entregas'));
        pintar();
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

async function actualizar(entrega, estado) {
    if (ocupado) return;
    ocupado = true;
    try {
        const respuesta = await fetch(`/repartidor/api/entregas/${entrega.id_entrega}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        mostrarMensaje((await leerRespuesta(respuesta)).mensaje, true);
    } catch (error) {
        mostrarMensaje(error.message);
    } finally {
        ocupado = false;
        await cargarEntregas();
    }
}

porId('filtro-activas').addEventListener('click', () => { verEntregadas = false; pintar(); });
porId('filtro-entregadas').addEventListener('click', () => { verEntregadas = true; pintar(); });
porId('actualizar').addEventListener('click', cargarEntregas);

setInterval(() => { if (!document.hidden && !ocupado) cargarEntregas(); }, 30000);
cargarEntregas();
