document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica del selector de recetas (se queda igual)
    const selectReceta = document.getElementById('receta_busqueda');
    if (selectReceta) {
        selectReceta.addEventListener('change', (event) => {
            const idProducto = event.target.value;
            cargarReceta(idProducto);
        });
    }

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
                window.location.href = '/panadero'; 
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