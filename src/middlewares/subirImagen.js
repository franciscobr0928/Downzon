const multer = require('multer');
const path = require('path');

const almacenamiento = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/img/productos/');
    },
    filename: (req, file, callback) => {
        const nombre = Date.now() + path.extname(file.originalname);
        callback(null, nombre);
    }
});

const filtroImagen = (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
        callback(null, true);
    } else {
        callback(new Error('El archivo debe ser una imagen'), false);
    }
};

const subirImagen = multer({
    storage: almacenamiento,
    fileFilter: filtroImagen,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

module.exports = subirImagen;