class Producto {
    constructor(id_producto, nombre, descripcion, precio, cantidad, imagen) {
        this.id_producto = id_producto;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.cantidad = cantidad;
        this.imagen = imagen;
    }
}

module.exports = Producto;