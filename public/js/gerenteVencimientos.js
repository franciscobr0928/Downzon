const tbody = document.getElementById('tabla-vencimientos');
const selectDias = document.getElementById('dias');

const celda = (fila, texto) => {
    const td = document.createElement('td');
    td.textContent = texto;
    fila.appendChild(td);
    return td;
};

const mensaje = (texto) => {
    tbody.innerHTML = '';
    const fila = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = texto;
    fila.appendChild(td);
    tbody.appendChild(fila);
};

// Estado según los días restantes calculados por la base de datos
const estadoDe = (dias) => {
    if (dias < 0) return { texto: `Vencido hace ${Math.abs(dias)} día(s)`, clase: 'estado-vencido' };
    if (dias === 0) return { texto: 'Vence hoy', clase: 'estado-hoy' };
    return { texto: `Vence en ${dias} día(s)`, clase: 'estado-proximo' };
};

const cargar = () => {
    mensaje('Cargando...');
    fetch(`/gerente/vencimientos/api?dias=${selectDias.value}`)
        .then(r => {
            if (!r.ok) throw new Error('Error del servidor');
            return r.json();
        })
        .then(productos => {
            if (productos.length === 0) return mensaje('No hay productos próximos a vencer en este periodo.');
            tbody.innerHTML = '';
            productos.forEach(p => {
                const fila = document.createElement('tr');
                celda(fila, p.producto);
                celda(fila, p.fecha_consumo_preferente);
                const estado = estadoDe(p.dias_restantes);
                const td = celda(fila, estado.texto);
                td.className = estado.clase;
                celda(fila, p.cantidad_producida);
                celda(fila, p.stock_actual);
                celda(fila, p.panadero || '-');
                tbody.appendChild(fila);
            });
        })
        .catch(error => {
            console.error(error);
            mensaje('No se pudieron cargar los productos por vencer.');
        });
};

selectDias.addEventListener('change', cargar);
cargar();
