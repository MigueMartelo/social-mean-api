'use strict'

let express = require('express');
let bodyParser = require('body-parser');

let app = express();

// cargar rutas
let user_routes = require('./routes/user');
let follow_routes = require('./routes/follow');
let publication_routes = require('./routes/publitacion');
let message_routes = require('./routes/message');

// middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
 
// cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

// rutas
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);

// exportar
module.exports = app;