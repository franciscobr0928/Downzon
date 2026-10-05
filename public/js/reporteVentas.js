window.onload=function(){
    cargarReporteVentas();
};

function cargarReporteVentas(){
    fetch('/cajero/reporte-ventas/datos')
    .then(res=>res.json())
    .then(ventas=>{
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