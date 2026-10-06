let datosVentas = []; // Variable global para guardar los datos y usarlos en el TXT

window.onload = function(){
    cargarReporteVentas();
};

function cargarReporteVentas(){
    fetch('/cajero/reporte-ventas/datos')
    .then(res=>res.json())
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
    contenidoTxt += `Ingresos Totales: ${document.getElementById('ingresosTotales').textContent}\n`;

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