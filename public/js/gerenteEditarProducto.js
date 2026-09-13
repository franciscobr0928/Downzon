const formulario = document.getElementById('form-editar-producto');
const partesUrl = window.location.pathname.split('/');
const id = partesUrl[partesUrl.length - 1];

fetch(`/productos/${id}`)
    .then(respuesta => respuesta.json())
    .then(producto => {
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('precio').value = producto.precio;
        document.getElementById('cantidad').value = producto.cantidad;
        document.getElementById('imagen_actual').value = producto.imagen || '';
    })
    .catch(error => {
        console.error(error);
        alert('No se pudo cargar el producto');
    });

formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    fetch(`/productos/${id}`, {
        method: 'PUT',
        body: datos
    })
        .then(respuesta => respuesta.json())
        .then(resultado => {
            alert(resultado.mensaje);
            window.location.href = '/gerente/productos';
        })
        .catch(error => {
            console.error(error);
            alert('No se pudo actualizar el producto');
        });
});
