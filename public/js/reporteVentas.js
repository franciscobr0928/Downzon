let datosVentas = []; // Variable global para guardar los datos y usarlos en el TXT

let periodoTexto = 'Todas las ventas'; // Texto del periodo para el TXT

window.onload = function(){
    document.getElementById('btnFiltrar').addEventListener('click', cargarReporteVentas);
    document.getElementById('btnLimpiar').addEventListener('click', function(){
        document.getElementById('fechaDesde').value = '';
        document.getElementById('fechaHasta').value = '';
        cargarReporteVentas();
    });
    cargarReporteVentas();
};

function cargarReporteVentas(){
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;

    if (desde && hasta && desde > hasta) {
        alert('La fecha inicial no puede ser posterior a la final');
        return;
    }

    // La ruta de datos depende de la pantalla (cajero o gerente)
    const api = document.body.dataset.api || '/cajero/reporte-ventas/datos';
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const url = params.toString() ? api + '?' + params.toString() : api;

    if (desde && hasta) periodoTexto = 'Del ' + desde + ' al ' + hasta;
    else if (desde) periodoTexto = 'Desde ' + desde;
    else if (hasta) periodoTexto = 'Hasta ' + hasta;
    else periodoTexto = 'Todas las ventas';

    document.getElementById('textoPeriodo').textContent = 'Mostrando: ' + periodoTexto;

    fetch(url)
    .then(res=>{
        if(!res.ok) throw new Error('Respuesta inválida del servidor');
        return res.json();
    })
    .then(ventas=>{
        datosVentas = ventas; // Guardamos los datos para el reporte TXT
        
        let tabla=document.getElementById('tablaVentas');
        tabla.innerHTML='';

        let totalVentas=new Set();
        let ingresos=0;
        let productos=0;

        ventas.forEach(venta=>{
            totalVentas.add(venta.id_venta);
            ingresos+=Number(venta.subtotal);
            productos+=Number(venta.cantidad);

            tabla.innerHTML+=`
                <tr>
                    <td>${venta.id_venta}</td>
                    <td>${new Date(venta.fecha).toLocaleString('es-MX')}</td>
                    <td>${venta.producto}</td>
                    <td>${venta.cantidad}</td>
                    <td>$${Number(venta.subtotal).toFixed(2)}</td>
                    <td>$${Number(venta.total).toFixed(2)}</td>
                </tr>
            `;
        });

        let cantidadVentas=totalVentas.size;
        let promedio=cantidadVentas>0?ingresos/cantidadVentas:0;

        document.getElementById('totalVentas').textContent=cantidadVentas;
        document.getElementById('ingresosTotales').textContent='$'+ingresos.toFixed(2);
        document.getElementById('productosVendidos').textContent=productos;
        document.getElementById('ventaPromedio').textContent='$'+promedio.toFixed(2);
    })
    .catch(error=>{
        console.log(error);
        alert('Error al cargar el reporte de ventas');
    });
}

// Nueva función para generar y descargar el TXT
function generarTXT() {
    if (datosVentas.length === 0) {
        alert("No hay datos para generar el reporte.");
        return;
    }

    let contenidoTxt = "=== REPORTE DE VENTAS ===\n";
    contenidoTxt += "Periodo: " + periodoTexto + "\n";
    contenidoTxt += "-------------------------------------------------------------------------\n";
    
    datosVentas.forEach(venta => {
        const fecha = new Date(venta.fecha).toLocaleString('es-MX');
        contenidoTxt += `Venta #${venta.id_venta} | Fecha: ${fecha}\n`;
        contenidoTxt += `Producto: ${venta.producto} | Cantidad: ${venta.cantidad} | Subtotal: $${Number(venta.subtotal).toFixed(2)}\n`;
        contenidoTxt += "-------------------------------------------------------------------------\n";
    });

    // Añadir los totales que ya calculaste en la pantalla
    contenidoTxt += `\nRESUMEN:\n`;
    contenidoTxt += `Total de Ventas (Tickets): ${document.getElementById('totalVentas').textContent}\n`;
    contenidoTxt += `Productos Vendidos: ${document.getElementById('productosVendidos').textContent}\n`;
    contenidoTxt += `Total vendido: ${document.getElementById('ingresosTotales').textContent}\n`;

    // Crear el archivo virtual y forzar la descarga
    const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = url;
    enlaceDescarga.download = `Reporte_Ventas_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.txt`;
    
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    
    // Limpiar el enlace
    document.body.removeChild(enlaceDescarga);
    URL.revokeObjectURL(url);
}