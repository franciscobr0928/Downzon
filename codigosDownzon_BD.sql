create database downzone;
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



#codigo nuevo papus
CREATE TABLE inventario (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    ingrediente VARCHAR(100) NOT NULL,
    stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
    unidad VARCHAR(20) NOT NULL,
    estado VARCHAR(30) NOT NULL
);
INSERT INTO inventario 
(ingrediente, stock_actual, unidad, estado)
VALUES
('Vainilla', 5, 'litros', 'Disponible'),
('Azúcar', 25, 'kg', 'Disponible'),
('Chocolate', 10, 'kg', 'Disponible'),
('Levadura', 8, 'kg', 'Stock bajo'),
('Harina', 50, 'kg', 'Disponible'),
('Masa', 20, 'kg', 'Disponible'),
('Sal', 10, 'kg', 'Disponible'),
('Huevo', 120, 'pzas', 'Disponible'),
('Leche', 15, 'litros', 'Disponible'),
('Canela', 3, 'kg', 'Stock bajo'),
('Aceite vegetal', 12, 'litros', 'Disponible');

SELECT * FROM inventario;


CREATE TABLE entradas_inventario (
    id_entrada INT AUTO_INCREMENT PRIMARY KEY,
    id_inventario INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_inventario)
    REFERENCES inventario(id_inventario)
);
DESCRIBE entradas_inventario;
select*from entradas_inventario;

CREATE TABLE salidas_inventario (
    id_salida INT AUTO_INCREMENT PRIMARY KEY,
    id_inventario INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_inventario)
    REFERENCES inventario(id_inventario)
);
select*from salidas_inventario;



#Nuevo codigo de osmar--------------------------------------------------------------------------
CREATE TABLE recetas (
    id_producto INT,
    id_inventario INT,
    cantidad_necesaria DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_producto, id_inventario),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_inventario) REFERENCES inventario(id_inventario)
);

CREATE TABLE produccion_diaria (
    id_produccion INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL, -- El ID del panadero que hizo el pan
    cantidad_producida INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

INSERT INTO recetas (id_producto, id_inventario, cantidad_necesaria) VALUES 
-- Receta 1: Concha[cite: 6]
(1, 5, 0.5),  -- Harina[cite: 4]
(1, 2, 0.50),  -- Azúcar[cite: 4]
(1, 8, 5.00),  -- Huevo[cite: 4]
(1, 9, 1.00),  -- Leche[cite: 4]
(1, 1, 0.05),  -- Vainilla[cite: 4]

-- Receta 2: Cuernito[cite: 6]
(2, 5, 0.035),  -- Harina[cite: 4]
(2, 9, 0.50),  -- Leche[cite: 4]
(2, 7, 0.05),  -- Sal[cite: 4]
(2, 8, 2.00),  -- Huevo[cite: 4]
(2, 11, 0.20), -- Aceite vegetal[cite: 4]

-- Receta 3: Dona de chocolate[cite: 6]
(3, 5, 0.025),  -- Harina[cite: 4]
(3, 2, 0.30),  -- Azúcar[cite: 4]
(3, 8, 3.00),  -- Huevo[cite: 4]
(3, 3, 0.40),  -- Chocolate[cite: 4]
(3, 11, 0.50), -- Aceite vegetal[cite: 4]

-- Receta 4: Bolillo[cite: 6]
(4, 5, 0.05),  -- Harina[cite: 4]
(4, 4, 0.20),  -- Levadura[cite: 4]
(4, 7, 0.10),  -- Sal[cite: 4]

-- Receta 5: Pan dulce[cite: 6]
(5, 5, 0.5),  -- Harina[cite: 4]
(5, 2, 0.40),  -- Azúcar[cite: 4]
(5, 8, 2.00),  -- Huevo[cite: 4]
(5, 10, 0.05), -- Canela[cite: 4]
(5, 9, 0.50),  -- Leche[cite: 4]

-- Receta 6: Pastel[cite: 6]
(6, 5, 1.00),  -- Harina[cite: 4]
(6, 2, 0.50),  -- Azúcar[cite: 4]
(6, 8, 6.00),  -- Huevo[cite: 4]
(6, 9, 0.80),  -- Leche[cite: 4]
(6, 1, 0.10),  -- Vainilla[cite: 4]
(6, 3, 0.30);  -- Chocolate[cite: 4]

SELECT 
    p.nombre AS Nombre_del_Pan,
    i.ingrediente AS Ingrediente,
    r.cantidad_necesaria AS Cantidad,
    i.unidad AS Unidad
FROM recetas r
JOIN productos p ON r.id_producto = p.id_producto
JOIN inventario i ON r.id_inventario = i.id_inventario
ORDER BY p.id_producto;
#nuevo codigo ninooooooo-------------------------------
ALTER TABLE produccion_diaria
    ADD COLUMN fecha_consumo_preferente DATE NULL;

ALTER TABLE produccion_diaria
    ADD COLUMN fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;





#semana 4 de jesus - parte de cajero pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    tipo_entrega ENUM('Recoger', 'Domicilio') NOT NULL,
    direccion VARCHAR(255) NULL,
    referencias VARCHAR(255) NULL,
    fecha_entrega DATETIME NOT NULL,
    notas_preparacion VARCHAR(1000) NULL,
    total DECIMAL(12,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),
    INDEX idx_pedidos_entrega (fecha_entrega)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    nombre_producto VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    indicaciones VARCHAR(500) NULL,
    CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
) ENGINE=InnoDB;

SELECT  * FROM detalle_pedido;
SELECT  * FROM pedidos;



