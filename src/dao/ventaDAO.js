const conexion = require("../base_de_datos/conexion");

// Crear venta
exports.crearVenta = (total, callback) => {
  const sql = `
        INSERT INTO ventas(total)
        VALUES(?)
    `;

  conexion.query(sql, [total], (error, resultado) => {
    if (error) {
      callback(error, null);
      return;
    }

    callback(null, resultado.insertId);
  });
};

// Guardar detalle de venta
exports.guardarDetalle = (detalle, callback) => {
  const sql = `
        INSERT INTO detalle_venta
        (
            id_venta,
            id_producto,
            cantidad,
            subtotal
        )
        VALUES(?,?,?,?)
    `;

  conexion.query(
    sql,

    [detalle.id_venta, detalle.id_producto, detalle.cantidad, detalle.subtotal],

    (error, resultado) => {
      callback(error, resultado);
    },
  );
};

// Actualizar inventario
exports.actualizarInventario = (id_producto, cantidad, callback) => {
  const sql = `
        UPDATE productos
        SET cantidad = cantidad - ?
        WHERE id_producto = ?
    `;

  conexion.query(
    sql,

    [cantidad, id_producto],

    (error, resultado) => {
      callback(error, resultado);
    },
  );
};

exports.obtenerVentas = (callback) => {
  const sql = `

    SELECT * FROM ventas

    ORDER BY id_venta DESC

    `;

  conexion.query(sql, (error, resultados) => {
    callback(error, resultados);
  });
};

// Reporte de ventas (con detalle de productos).
// desde y hasta son opcionales y vienen como 'AAAA-MM-DD' (ambos días incluidos).
exports.obtenerReporte = (desde, hasta, callback) => {
  const condiciones = [];
  const parametros = [];

  if (desde) {
    condiciones.push("v.fecha >= ?");
    parametros.push(desde);
  }

  if (hasta) {
    condiciones.push("v.fecha < DATE_ADD(?, INTERVAL 1 DAY)");
    parametros.push(hasta);
  }

  const donde = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";

  const sql = `
        SELECT
            v.id_venta,
            v.fecha,
            p.nombre AS producto,
            d.cantidad,
            d.subtotal,
            v.total
        FROM ventas v
        INNER JOIN detalle_venta d ON v.id_venta = d.id_venta
        INNER JOIN productos p ON d.id_producto = p.id_producto
        ${donde}
        ORDER BY v.fecha DESC
    `;

  conexion.query(sql, parametros, (error, resultados) => {
    callback(error, resultados);
  });
};
