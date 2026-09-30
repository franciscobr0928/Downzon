// Aviso de productos próximos a vencer en el panel del gerente
const contenedorAlerta = document.getElementById('alerta-vencimientos');

fetch('/gerente/vencimientos/api?dias=3')
    .then(r => (r.ok ? r.json() : []))
    .then(productos => {
        if (productos.length === 0) return;
        const titulo = document.createElement('h2');
        titulo.textContent = `Atención: ${productos.length} lote(s) próximos a vencer`;
        contenedorAlerta.appendChild(titulo);

        const ul = document.createElement('ul');
        productos.forEach(p => {
            const d = p.dias_restantes;
            const estado = d < 0 ? `vencido hace ${Math.abs(d)} día(s)` : (d === 0 ? 'vence hoy' : `vence en ${d} día(s)`);
            const li = document.createElement('li');
            li.textContent = `${p.producto}: ${estado} (${p.fecha_consumo_preferente})`;
            if (d <= 0) li.className = 'vencido';
            ul.appendChild(li);
        });
        contenedorAlerta.appendChild(ul);

        const enlace = document.createElement('a');
        enlace.href = '/gerente/vencimientos';
        enlace.textContent = 'Ver detalle';
        contenedorAlerta.appendChild(enlace);
        contenedorAlerta.style.display = 'block';
    })
    .catch(error => console.error(error));
