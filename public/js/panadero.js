document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica del selector de recetas (se queda igual)
    const selectReceta = document.getElementById('receta_busqueda');
    if (selectReceta) {
        selectReceta.addEventListener('change', (event) => {
            const idProducto = event.target.value;
            cargarReceta(idProducto);
        });
    }

    // Fecha de consumo preferente: por defecto hoy y no permite fechas pasadas
    const campoFecha = document.getElementById('fecha_consumo_preferente');
    if (campoFecha) {
        const hoy = new Date();
        const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        campoFecha.min = hoyTexto;
        campoFecha.value = hoyTexto;
    }

    // Historial y aviso de vencimientos
    cargarProducciones();
    cargarVencimientos();

    // 2. NUEVA Lógica del formulario interceptado con Fetch
    const formProduccion = document.getElementById('form-produccion');
    if (formProduccion) {
        formProduccion.addEventListener('submit', (evento) => {
            evento.preventDefault(); // Evita que la página se recargue

            // Obtenemos los datos del formulario y los pasamos a JSON
            const formData = new FormData(formProduccion);
            const datos = Object.fromEntries(formData.entries());

            fetch('/panadero/produccion/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            })
            .then(respuesta => respuesta.json())
            .then(resultado => {
                // Muestra el mensaje que viene desde el controlador
                alert(resultado.mensaje);
                // Recarga la misma página para limpiar el formulario y actualizar la vista
                window.location.href = '/panadero/produccion'; 
            })
            .catch(error => {
                console.error(error);
                alert('No se pudo registrar la producción');
            });
        });
    }
});

// La función asíncrona cargarReceta() se queda aquí abajo sin cambios...

async function cargarReceta(idProducto) {
    const tbody = document.getElementById('lista_ingredientes');
    
    // Si el usuario selecciona la opción por defecto (vacía)
    if (!idProducto) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Selecciona un producto para ver su receta</td></tr>';
        return;
    }

    // Mostrar un estado de carga mientras el servidor responde
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Cargando ingredientes...</td></tr>';

    try {
        // Hacemos la petición GET a tu servidor Express
        // Se utiliza el prefijo /panadero de acuerdo a tu app.js
        const response = await fetch(`/panadero/api/recetas/${idProducto}`);
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const ingredientes = await response.json();
        
        // Limpiar tabla antes de insertar
        tbody.innerHTML = '';

        // Si el producto no tiene ingredientes registrados en la base de datos
        if (ingredientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Este producto aún no tiene una receta registrada.</td></tr>';
            return;
        }

        // Iterar sobre los ingredientes devueltos por la base de datos e insertarlos en la tabla
        ingredientes.forEach(ing => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ing.Ingrediente}</td>
                <td>${ing.Cantidad}</td>
                <td>${ing.Unidad}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar la receta:", error);
        tbody.innerHTML = '<tr><td colspan="3" style="color: red; text-align: center; padding: 20px;">Ocurrió un error al cargar los ingredientes. Verifica tu consola y conexión.</td></tr>';
    }
}

async function cargarProducciones() {
    const tbody = document.getElementById('lista_producciones');
    if (!tbody) return;
    try {
        const r = await fetch('/panadero/api/produccion');
        if (!r.ok) throw new Error('Error del servidor');
        const registros = await r.json();
        tbody.innerHTML = '';
        if (registros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aún no hay producciones registradas.</td></tr>';
            return;
        }
        registros.forEach(reg => {
            const tr = document.createElement('tr');
            [reg.fecha_registro || '-', reg.producto, reg.cantidad_producida,
             reg.fecha_consumo_preferente || '-', reg.panadero || 'Sin panadero asignado'
            ].forEach(valor => {
                const td = document.createElement('td');
                td.textContent = valor;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No se pudo cargar el historial.</td></tr>';
    }
}

async function cargarVencimientos() {
    const cont = document.getElementById('alerta-vencimientos');
    if (!cont) return;
    try {
        const r = await fetch('/panadero/api/vencimientos?dias=3');
        if (!r.ok) return;
        const productos = await r.json();
        if (productos.length === 0) {
            cont.style.display = 'none';
            return;
        }
        cont.innerHTML = '';
        const titulo = document.createElement('h3');
        titulo.textContent = 'Productos próximos a vencer (consumo preferente)';
        cont.appendChild(titulo);
        const ul = document.createElement('ul');
        productos.forEach(p => {
            const li = document.createElement('li');
            const d = p.dias_restantes;
            const estado = d < 0 ? `vencido hace ${Math.abs(d)} día(s)` : (d === 0 ? 'vence hoy' : `vence en ${d} día(s)`);
            li.textContent = `${p.producto}: ${estado} (${p.fecha_consumo_preferente}) - stock ${p.stock_actual}`;
            if (d <= 0) li.className = 'vencido';
            ul.appendChild(li);
        });
        cont.appendChild(ul);
        cont.style.display = 'block';
    } catch (e) {
        console.error(e);
    }
}
