const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'userDownzon',
    password: 'downzon123',
    database: 'downzon'
});

conexion.connect((error) => {
    if (error) {
        console.error('No jaló:', error.message);
        return;
    }
    console.log('Si jaló');
});

module.exports = conexion;