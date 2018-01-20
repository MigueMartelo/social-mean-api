'use strict'

let bcrypt = require('bcrypt-nodejs');
let User = require('../models/user');
let jwt = require('../services/jwt');
let mongoosePagination = require('mongoose-pagination');
let fs = require('fs');
let path = require('path');

// Test methods
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

// Save users DB
function saveUser(req, res) {
	let params = req.body;
	let user = new User();

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

// Login user
function loginUser(req, res){
	let params = req.body;

	let email = params.email;
	let password = params.password;

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

// Get user information
function getUser(req, res){
	let userId = req.params.id;

	User.findById(userId, (err, user) => {
		if(err) return res.status(500).send({message: 'Error en la petición!'});

		if(!user) return res.status(404).send({message: 'El usuario no existe'});

		user.password = undefined;
		return res.status(200).send({user});
	});
}

// Get users list paginated
function getUsers(req, res){
	let identityUserId = req.user.sub;

	let page = 1;
	if(req.params.page){ page = req.params.page; }

	let itemsPerPage = 3;
	User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!users) return res.status(500).send({message: 'No hay usuarios disponibles'});

		return res.status(200).send({
			users,
			total,
			pages: Math.ceil(total/itemsPerPage)
		});
	});
}

// Update user
function userUpdate(req, res){
	let userId = req.params.id;
	let update = req.body;

	//delete password
	delete update.password;

	if(userId != req.user.sub){
		return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});		
	}

	User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

		userUpdated.password = undefined;
		return res.status(200).send({userUpdated});
	});
}

// Upload images file and avatar users
function uploadImage(req, res){
	let userId = req.params.id;

	if(req.files){
		let file_path = req.files.image.path;

		let file_split = file_path.split('/');

		let file_name = file_split[2];

		let ext_split = file_name.split('\.');
		let file_ext = ext_split[1];

		if(userId != req.user.sub){
			return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
		}

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
			// Update document user
			User.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated) => {
						if(err) return res.status(500).send({message: 'Error en la petición'});

						if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

						userUpdated.password = undefined;
						return res.status(200).send({userUpdated});
					});
		}else {
			return removeFilesOfUploads(res, file_path, 'Extensión no válida');
		}

	}else{
		return res.status(200).send({message: 'No se han subido imagenes'});
	}
}

function removeFilesOfUploads(res, file_path, message){
	fs.unlink(file_path, (err) => {
		return res.status(200).send({message: message});
	});
}

function getImageFile(req, res){
	let image_file = req.params.imageFile;
	let path_file = './uploads/users/'+image_file;

	fs.exists(path_file, (exists) => {
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'No existe la imagen...'});
		}
	});
}

module.exports = {
	home,
	pruebas,
	saveUser,
	loginUser,
	getUser,
	getUsers,
	userUpdate,
	uploadImage,
	getImageFile
}