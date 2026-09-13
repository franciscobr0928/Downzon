const express = require('express');
const path = require('path');
const session = require('express-session');
const inicioRutas = require('./src/rutas/inicioRutas');
const loginRutas = require('./src/rutas/loginRutas');
const gerenteRutas = require('./src/rutas/gerenteRutas');
const cajeroRutas = require('./src/rutas/cajeroRutas');
const panaderoRutas = require('./src/rutas/panaderoRutas');
const productoRutas = require('./src/rutas/productoRutas');
const app = express();
const puerto = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(session({
    secret: 'downzon_secreto',
    resave: false,
    saveUninitialized: false
}));

app.use('/', inicioRutas);

app.use('/login', loginRutas);

app.use('/gerente', gerenteRutas);

app.use('/cajero', cajeroRutas);

app.use('/panadero', panaderoRutas);

app.use('/productos', productoRutas);

app.listen(puerto, () => {
    console.log('Ya jaló');
});
