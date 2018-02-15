'use strict'

let path = require('path');
let fs = require('fs');
let moment = require('moment');
let mongoosePaginate = require('mongoose-pagination');

let Publication = require('../models/publication');
let User = require('../models/user');
let Follow = require('../models/follow');

function savePublication(req, res){
	let params = req.body;	

	if(!params.text) return res.status(200).send({message: 'Debes enviar un texto!'});

	let publication = new Publication();
	publication.text = params.text;
	publication.file = 'null';
	publication.user = req.user.sub;
	publication.created_at = moment().unix();

	publication.save((err, publicationStored) => {
		if(err) return res.status(500).send({message: 'Error al guardar la publicación'});

		if(!publicationStored) return res.status(404).send({message: 'Error al guardar la publicación'});

		return res.status(200).send({publicationStored});
	});
}

function getPublications(req, res){
	let page = 1;
	if(req.params.page){
		page = req.params.page;
	}

	let itemsPerPage = 4;

	Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
		if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});

		let follows_clean = [];

		follows.forEach((follow) => {
			follows_clean.push(follow.followed);
		});
		follows_clean.push(req.user.sub);

		Publication.find({user: {'$in': follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
			if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});			

			if(!publications) return res.status(404).send({message: 'No hay publicaciones'});

			return res.status(200).send({
				total_items: total,
				pages: Math.ceil(total/itemsPerPage),
				page: page,
				items_per_page: itemsPerPage,
				publications
			})
		});

	});
}

function getPublicationsUser(req, res){
	let page = 1;
	if(req.params.page){
		page = req.params.page;
	}

	let user = req.user.sub;
	if(req.params.user){
		user = req.params.user;
	}

	let itemsPerPage = 4;
	
	Publication.find({user: user}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
		if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});			

		if(!publications) return res.status(404).send({message: 'No hay publicaciones'});

		return res.status(200).send({
			total_items: total,
			pages: Math.ceil(total/itemsPerPage),
			page: page,
			items_per_page: itemsPerPage,
			publications
		});
	});
}

function getPublication(req, res){
	let publicationId = req.params.id;

	Publication.findById(publicationId, (err, publication) => {
		if(err) return res.status(500).send({message: 'Error al devolver la publicación'});

		if(!publication) return res.status(404).send({message: 'No existe la plublicación'});

		return res.status(200).send({publication});
	});
}

function deletePublication(req, res){
	let publicationId = req.params.id;

	Publication.find({'user': req.user.sub, '_id': publicationId}).remove(err => {
		if(err) return res.status(500).send({message: 'Error al eliminar la publicación'});		

		return res.status(200).send({message: 'Publicación eliminada correctamente'});
	});
}

function uploadImage(req, res){
	let publicationId = req.params.id;

	if(req.files){
		let file_path = req.files.image.path;

		let file_split = file_path.split('/');

		let file_name = file_split[2];

		let ext_split = file_name.split('\.');
		let file_ext = ext_split[1];

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
			Publication.findOne({'user':req.user.sub, '_id':publicationId}).exec((err, publication) => {
				if(publication){
					// Update document publication
					Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new: true}, (err, publicationUpdated) => {
						if(err) return res.status(500).send({message: 'Error en la petición'});

						if(!publicationUpdated) return res.status(404).send({message: 'No se ha podido actualizar la publicación'});
						
						return res.status(200).send({publicationUpdated});
					});		
				}else {
					return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar esta publicación');
				}
			})
			
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
	let path_file = './uploads/publications/'+image_file;

	fs.exists(path_file, (exists) => {
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: 'No existe la imagen...'});
		}
	});
}

module.exports = {
	savePublication,
	getPublications,
	getPublicationsUser,
	getPublication,
	deletePublication,
	uploadImage,
	getImageFile
}
