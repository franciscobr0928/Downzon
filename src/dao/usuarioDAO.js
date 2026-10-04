const conexion = require('../base_de_datos/conexion');
const Usuario = require('../entidades/Usuario');

const buscarPorCredenciales = (username, password, callback) => {
    const consulta = `
        SELECT *
        FROM usuarios
        WHERE username = ?
        AND password = ?
        AND activo = TRUE
    `;
    conexion.query(consulta, [username, password], (error, resultados) => {
        if (error) {
            return callback(error, null);
        }
        if (resultados.length === 0) {
            return callback(null, null);
        }
        const datos = resultados[0];
        const usuario = new Usuario(
            datos.id_usuario,
            datos.nombre,
            datos.username,
            datos.password,
            datos.rol,
            datos.activo
        );
        callback(null, usuario);
    });
};

// Alta de un empleado con rol Repartidor.
const crearRepartidor = async (nombre, username, password) => {
    try {
        const [resultado] = await conexion.promise().query(
            `INSERT INTO usuarios (nombre, username, password, rol)
             VALUES (?, ?, ?, 'Repartidor')`,
            [nombre, username, password]
        );
        return { id_usuario: resultado.insertId, nombre, username };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const duplicado = new Error('Ese nombre de usuario ya existe. Elige otro.');
            duplicado.status = 409;
            throw duplicado;
        }
        throw error;
    }
};

module.exports = {
    buscarPorCredenciales,
    crearRepartidor
};