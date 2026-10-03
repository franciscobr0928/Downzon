const mysql = require('mysql2');
const mysqlPromesas = require('mysql2/promise');

// Configuración compartida para todas las conexiones.
const configuracion = {
    host: 'localhost',
    user: 'userDownzon',
    password: 'downzon123',
    database: 'downzon'
};

// Conexión que utilizan los módulos existentes.
const conexion = mysql.createConnection(configuracion);

conexion.connect((error) => {
    if (error) {
        console.error('No jaló:', error.message);
        return;
    }

    console.log('Si jaló');
});

// Conexión temporal para la transacción de cada pedido.
// Utiliza la misma configuración y la misma base de datos.
conexion.crearConexion = () => {
    return mysqlPromesas.createConnection(configuracion);
};

module.exports = conexion;