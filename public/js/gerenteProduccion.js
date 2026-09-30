const tbody = document.getElementById('tabla-produccion');

const celda = (fila, texto) => {
    const td = document.createElement('td');
    td.textContent = texto;
    fila.appendChild(td);
};

const mensaje = (texto) => {
    tbody.innerHTML = '';
    const fila = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = texto;
    fila.appendChild(td);
    tbody.appendChild(fila);
};

fetch('/gerente/produccion/historial')
    .then(r => {
        if (!r.ok) throw new Error('Error del servidor');
        return r.json();
    })
    .then(registros => {
        if (registros.length === 0) return mensaje('Aún no hay producciones registradas.');
        registros.forEach(r => {
            const fila = document.createElement('tr');
            celda(fila, r.fecha_registro || '-');
            celda(fila, r.producto);
            celda(fila, r.cantidad_producida);
            celda(fila, r.fecha_consumo_preferente || '-');
            celda(fila, r.panadero || 'Sin panadero asignado');
            tbody.appendChild(fila);
        });
    })
    .catch(error => {
        console.error(error);
        mensaje('No se pudo cargar el historial de producción.');
    });
