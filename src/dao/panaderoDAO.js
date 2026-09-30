// Importamos la conexión a la base de datos
const conexion = require('../base_de_datos/conexion');

const obtenerRecetaPorProducto = (idProducto, callback) => {
    const query = `
        SELECT 
            p.nombre AS Nombre_del_Pan,
            i.ingrediente AS Ingrediente,
            r.cantidad_necesaria AS Cantidad,
            i.unidad AS Unidad
        FROM recetas r
        JOIN productos p ON r.id_producto = p.id_producto
        JOIN inventario i ON r.id_inventario = i.id_inventario
        WHERE r.id_producto = ?
    `;
    
    conexion.query(query, [idProducto], (error, resultados) => {
        if (error) {
            return callback(error, null);
        }
        callback(null, resultados);
    });
};

const guardarProduccion = (idProducto, idPanadero, cantidad, fechaConsumoPreferente, callback) => {
    // Iniciamos la transacción directamente en tu conexión actual
    conexion.beginTransaction((errTx) => {
        if (errTx) {
            return callback(errTx, null);
        }

        // Paso 0: Verificar stock matemáticamente
        const consultaValidacion = `
            SELECT i.ingrediente, i.stock_actual, (r.cantidad_necesaria * ?) AS cantidad_requerida
            FROM inventario i
            JOIN recetas r ON i.id_inventario = r.id_inventario
            WHERE r.id_producto = ?
        `;

        conexion.query(consultaValidacion, [cantidad, idProducto], (errorVal, resultadosVal) => {
            if (errorVal) {
                return conexion.rollback(() => callback(errorVal, null));
            }

            // Revisamos si algún ingrediente no alcanza
            let ingredientesFaltantes = [];
            for (let fila of resultadosVal) {
                if (fila.stock_actual < fila.cantidad_requerida) {
                    ingredientesFaltantes.push(fila.ingrediente);
                }
            }

            // Si hay faltantes, abortamos la transacción
            if (ingredientesFaltantes.length > 0) {
                const errorStock = new Error(`Materia prima insuficiente: faltan existencias de ${ingredientesFaltantes.join(', ')}`);
                errorStock.codigo = 'STOCK_INSUFICIENTE';
                return conexion.rollback(() => callback(errorStock, null));
            }

            // Paso 1: Registrar en el historial de producción
            const consultaInsert = `INSERT INTO produccion_diaria (id_producto, id_usuario, cantidad_producida, fecha_consumo_preferente) VALUES (?, ?, ?, ?)`;
            conexion.query(consultaInsert, [idProducto, idPanadero, cantidad, fechaConsumoPreferente], (errorInsert) => {
                if (errorInsert) {
                    return conexion.rollback(() => callback(errorInsert, null));
                }

                // Paso 2: Sumar la nueva cantidad al stock de productos terminados
                const consultaUpdateProd = `UPDATE productos SET cantidad = cantidad + ? WHERE id_producto = ?`;
                conexion.query(consultaUpdateProd, [cantidad, idProducto], (errorProd) => {
                    if (errorProd) {
                        return conexion.rollback(() => callback(errorProd, null));
                    }
                    
                    // Paso 3: Descontar los ingredientes proporcionales del inventario
                    const consultaUpdateInv = `
                        UPDATE inventario i
                        JOIN recetas r ON i.id_inventario = r.id_inventario
                        SET i.stock_actual = i.stock_actual - (r.cantidad_necesaria * ?)
                        WHERE r.id_producto = ?
                    `;
                    conexion.query(consultaUpdateInv, [cantidad, idProducto], (errorInv, resultadosInv) => {
                        if (errorInv) {
                            return conexion.rollback(() => callback(errorInv, null));
                        }
                        
                        // Si los 3 pasos salieron bien, guardamos los cambios definitivamente (Commit)
                        conexion.commit((errorCommit) => {
                            if (errorCommit) {
                                return conexion.rollback(() => callback(errorCommit, null));
                            }
                            callback(null, resultadosInv); // Éxito total
                        });
                    });
                });
            });
        });
    });
};

// Historial: qué panadero realizó cada producción
const obtenerHistorialProduccion = (callback) => {
    const query = `
        SELECT
            DATE_FORMAT(pd.fecha_registro, '%Y-%m-%d %H:%i') AS fecha_registro,
            p.nombre AS producto,
            pd.cantidad_producida,
            DATE_FORMAT(pd.fecha_consumo_preferente, '%Y-%m-%d') AS fecha_consumo_preferente,
            u.nombre AS panadero
        FROM produccion_diaria pd
        JOIN productos p ON p.id_producto = pd.id_producto
        LEFT JOIN usuarios u ON u.id_usuario = pd.id_usuario
        ORDER BY pd.fecha_registro DESC
        LIMIT 200
    `;
    conexion.query(query, (error, resultados) => callback(error, resultados));
};

// Productos con consumo preferente próximo (o vencido en los últimos 7 días)
const obtenerProximosAVencer = (dias, callback) => {
    const query = `
        SELECT
            p.id_producto,
            p.nombre AS producto,
            p.cantidad AS stock_actual,
            pd.cantidad_producida,
            DATE_FORMAT(pd.fecha_consumo_preferente, '%Y-%m-%d') AS fecha_consumo_preferente,
            DATEDIFF(pd.fecha_consumo_preferente, CURDATE()) AS dias_restantes,
            u.nombre AS panadero
        FROM produccion_diaria pd
        JOIN productos p ON p.id_producto = pd.id_producto
        LEFT JOIN usuarios u ON u.id_usuario = pd.id_usuario
        WHERE pd.fecha_consumo_preferente IS NOT NULL
          AND pd.fecha_consumo_preferente <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
          AND pd.fecha_consumo_preferente >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND p.cantidad > 0
        ORDER BY pd.fecha_consumo_preferente ASC, p.nombre ASC
    `;
    conexion.query(query, [dias], (error, resultados) => callback(error, resultados));
};

module.exports = {
    obtenerRecetaPorProducto,
    guardarProduccion,
    obtenerHistorialProduccion,
    obtenerProximosAVencer
};