const path = require('path');
const db = require('../base_de_datos/conexion');

const mostrarPanelGerente = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'gerente.html')
    );
};

const mostrarGestionProductos = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'gerenteProductos.html')
    );
};

const mostrarAgregarProducto = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'gerenteAgregarProducto.html')
    );
};

const mostrarEditarProducto = (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'gerenteEditarProducto.html')
    );
};
const mostrarAlmacen = (req, res) => {

    res.sendFile(
        path.join(__dirname, '..', '..', 'vistas', 'almacen.html')
    );

};
const obtenerInventario = (req, res) => {
    db.query(
        'SELECT * FROM inventario',
        (error, resultados) => {
            if (error) {
                console.log(error);
                res.status(500).json({
                    mensaje: "Error consultando inventario"
                });
                return;
            }
            res.json(resultados);
        }
    );
};
const obtenerIngrediente = (req, res) => {
    const id = req.params.id;
    db.query(
        "SELECT * FROM inventario WHERE id_inventario=?",
        [id],
        (error, resultado) => {
            if (error) {
                return res.status(500).json(error);
            }
            res.json(resultado[0]);
        }
    );
};
const retirarStock = (req, res) => {
    const { id_inventario, cantidad } = req.body;
    if (cantidad <= 0) {
        return res.json({
            mensaje: "Cantidad inválida"
        });
    }
    db.query(
        "UPDATE inventario SET stock_actual=stock_actual-? WHERE id_inventario=? AND stock_actual>0 AND stock_actual>=?",
        [cantidad, id_inventario, cantidad],
        (error, resultado) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error);
            }
            if (resultado.affectedRows === 0) {
                return res.json({
                    mensaje: "No hay suficiente stock para realizar la salida"
                });
            }
            db.query(
                "UPDATE inventario SET estado=CASE WHEN stock_actual=0 THEN 'No disponible' WHEN stock_actual<10 THEN 'Stock bajo' ELSE 'Disponible' END WHERE id_inventario=?",
                [id_inventario],
                (error) => {
                    if (error) {
                        console.log(error);
                        return;
                    }
                    db.query(
                        "SELECT unidad FROM inventario WHERE id_inventario=?",
                        [id_inventario],
                        (error, datos) => {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            db.query(
                                "INSERT INTO salidas_inventario(id_inventario,cantidad,unidad) VALUES (?,?,?)",
                                [id_inventario, cantidad, datos[0].unidad],
                                (error) => {
                                    if (error) {
                                        console.log(error);
                                        return;
                                    }
                                    res.json({
                                        mensaje: "Salida registrada"
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

const agregarEntrada = (req, res) => {
    const { id_inventario, cantidad, unidad, fecha } = req.body;
    db.query(
        "UPDATE inventario SET stock_actual=stock_actual+? WHERE id_inventario=?",
        [cantidad, id_inventario],
        (error) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error);
            }
            db.query(
                "UPDATE inventario SET estado=CASE WHEN stock_actual=0 THEN 'No disponible' WHEN stock_actual<10 THEN 'Stock bajo' ELSE 'Disponible' END WHERE id_inventario=?",
                [id_inventario],
                (error) => {
                    if (error) {
                        console.log(error);
                        return;
                    }
                    db.query(
                        "INSERT INTO entradas_inventario(id_inventario,cantidad,unidad,fecha) VALUES (?,?,?,?)",
                        [id_inventario, cantidad, unidad, fecha],
                        (error) => {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            res.json({
                                mensaje: "Entrada registrada"
                            });
                        }
                    );
                }
            );
        }
    );
};

const obtenerEntradas = (req, res) => {
    db.query(
        `
        SELECT 
        e.fecha,
        i.ingrediente,
        e.cantidad,
        e.unidad
        FROM entradas_inventario e
        INNER JOIN inventario i
        ON e.id_inventario = i.id_inventario
        ORDER BY e.fecha DESC
        `,
        (error, resultados) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error);
            }
            res.json(resultados);
        }
    );
};

const obtenerSalidas = (req, res) => {
    db.query(
        `
        SELECT 
        s.fecha,
        i.ingrediente,
        s.cantidad,
        s.unidad
        FROM salidas_inventario s
        INNER JOIN inventario i
        ON s.id_inventario = i.id_inventario
        ORDER BY s.fecha DESC
        `,
        (error, resultados) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error);
            }
            res.json(resultados);
        }
    );
};

const obtenerEstadisticasAlmacen = (req, res) => {
    db.query(`
SELECT
(SELECT COUNT(*) FROM inventario) AS totalIngredientes,
(SELECT COUNT(*) FROM entradas_inventario WHERE MONTH(fecha)=MONTH(CURRENT_DATE()) AND YEAR(fecha)=YEAR(CURRENT_DATE())) AS entradasMes,
(SELECT COUNT(*) FROM salidas_inventario) AS salidas,
(SELECT COUNT(*) FROM inventario WHERE stock_actual<10 AND stock_actual>0) AS stockBajo
`, (error, resultado) => {
        if (error) {
            console.log(error);
            return res.status(500).json(error);
        }
        res.json(resultado[0]);
    });
};
module.exports = {
    mostrarPanelGerente,
    mostrarGestionProductos,
    mostrarAgregarProducto,
    mostrarEditarProducto,
    mostrarAlmacen,
    obtenerInventario,
    obtenerIngrediente,
    retirarStock,
    agregarEntrada,
    obtenerEntradas,
    obtenerSalidas,
    obtenerEstadisticasAlmacen
};