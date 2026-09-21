const express = require('express');

const path = require('path');

const session = require('express-session');


// Rutas

const inicioRutas = require('./src/rutas/inicioRutas');

const loginRutas = require('./src/rutas/loginRutas');

const gerenteRutas = require('./src/rutas/gerenteRutas');

const cajeroRutas = require('./src/rutas/cajeroRutas');

const panaderoRutas = require('./src/rutas/panaderoRutas');

const productoRutas = require('./src/rutas/productoRutas');

const ventaRutas = require('./src/rutas/ventaRutas');



const app = express();


const puerto = 3000;



// Middleware para archivos públicos

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);



// Middleware para recibir datos de formularios

app.use(
    express.urlencoded({
        extended:true
    })
);



// Middleware para recibir JSON (fetch)

app.use(
    express.json()
);



// Sesiones

app.use(
    session({

        secret:'downzon_secreto',

        resave:false,

        saveUninitialized:false

    })
);



// Rutas

app.use(
    '/',
    inicioRutas
);


app.use(
    '/login',
    loginRutas
);


app.use(
    '/gerente',
    gerenteRutas
);


app.use(
    '/cajero',
    cajeroRutas
);


app.use(
    '/panadero',
    panaderoRutas
);


app.use(
    '/productos',
    productoRutas
);


// Ruta de ventas
// IMPORTANTE: va después de express.json()

app.use(
    '/ventas',
    ventaRutas
);



// Encender servidor

app.listen(
    puerto,
    ()=>{

        console.log('Ya jaló');

    }
);