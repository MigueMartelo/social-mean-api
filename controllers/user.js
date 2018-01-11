'use strict'

var bcrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var jwt = require('../services/jwt');

function home(req, res) {
	res.status(200).send({
		message: 'Hola mundo en NodeJS'
	});
}

function pruebas(req, res) {
	res.status(200).send({
		message: 'Prueba de rutas en el server NodeJS'
	});
}

function saveUser(req, res) {
	var params = req.body;
	var user = new User();

	if(params.name && params.surname && params.nick && params.email && params.password){

		user.name = params.name;
		user.surname = params.surname;
		user.nick = params.nick;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;

		//Controlar usuario duplicado
		User.find({$or: [
			{email: user.email.toLowerCase()},
			{nick: user.nick.toLowerCase()}
		]}).exec((err, users) => {
			if(err) return res.status(500).send({message: 'Error en la petición de usuarios'});

			if(users && users.length >= 1){
				return res.status(200).send({messages: 'El nick o email ya existen!!'});
			}else{
				//Cifrar password y guardar usuario
				bcrypt.hash(params.password, null, null, (err, hash) => {
					user.password = hash;

					user.save((err, userStored) => {
						if(err) return rest.status(500).send({message: 'Error al guardar usuario'});

						if(userStored){
							userStored.password = undefined;
							res.status(200).send({user: userStored});
						} else {
							res.status(404).send({message: 'No se ha registrado el usuario'});
						}
					});
				});
			}
		});

	}else {
		res.status(200).send({
			message: 'Ingresa los datos necesarios correctamente!!'
		});
	}
}

function loginUser(req, res){
	var params = req.body;

	var email = params.email;
	var password = params.password;

	User.findOne({email: email}, (err, user) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(user){
			bcrypt.compare(password, user.password, (err, check) => {
				if(check){

					if(params.gettoken){
						//Generamos y devolvemos un token
						return res.status(200).send({
							token: jwt.createToken(user)
						});
					}else{
						//Devolvemos datos de usuario
						user.password = undefined;
						return res.status(200).send({user});
					}					
				}else{
					return res.status(404).send({message: 'El usuario no ha podido identificarse'});
				}
			})
		}else{
			return res.status(404).send({message: 'Usuario no identificado'});
		}
	});
}

module.exports = {
	home,
	pruebas,
	saveUser,
	loginUser
}