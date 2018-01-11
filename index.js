'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

//Conectar a la base de datos
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/curso_mean_social', { useMongoClient: true })
		  .then(() => {
		  	 console.log("La conexión a la base de datos curso_mean_social ha sido exitosa!!");

		  	 //Crear servidor
		  	 app.listen(port, () => {
		  	 	console.log("Servidor corriendo en http://localhost:"+port);
		  	 })
		  })
		  .catch(err => console.error(err));