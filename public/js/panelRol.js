// Nombre del usuario en el panel inicial del rol.
const nombreUsuario = document.querySelector('[data-perfil]');

if (nombreUsuario) {
    fetch(nombreUsuario.dataset.perfil)
        .then(respuesta => respuesta.ok ? respuesta.json() : null)
        .then(perfil => {
            if (perfil && perfil.nombre) nombreUsuario.textContent = perfil.nombre;
        })
        .catch(error => console.error(error));
}
