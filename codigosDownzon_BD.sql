USE downzon;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO usuarios (nombre, username, password, rol) VALUES
('Gerente Downzon', 'gerente', '1234', 'Gerente'),
('Cajero Downzon', 'cajero', '1234', 'Cajero'),
('Panadero Downzon', 'panadero', '1234', 'Panadero');

SELECT * FROM usuarios;

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200),
    precio DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    imagen VARCHAR(100)
);


INSERT INTO productos (nombre, descripcion, precio, cantidad) VALUES
('Concha', 'Pan dulce tradicional', 12.00, 30),
('Cuernito', 'Pan suave recién horneado', 15.00, 20),
('Dona de chocolate', 'Dona cubierta de chocolate', 18.00, 15),
('Bolillo', 'Pan crujiente por fuera y suave por dentro', 5.00, 50),
('Pan dulce', 'Pan tradicional de la casa', 14.00, 25),
('Pastel', 'Pastel para diferentes ocasiones', 250.00, 5);

SELECT * FROM productos;




CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL
);
select * from ventas;

CREATE TABLE detalle_venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    FOREIGN KEY(id_venta) 
    REFERENCES ventas(id_venta),

    FOREIGN KEY(id_producto)
    REFERENCES productos(id_producto)
);






