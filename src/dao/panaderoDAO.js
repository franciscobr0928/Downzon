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

const guardarProduccion = (idProducto, idPanadero, cantidad, callback) => {
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
            const consultaInsert = `INSERT INTO produccion_diaria (id_producto, id_usuario, cantidad_producida) VALUES (?, ?, ?)`;
            conexion.query(consultaInsert, [idProducto, idPanadero, cantidad], (errorInsert) => {
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

module.exports = {
    obtenerRecetaPorProducto,
    guardarProduccion
};