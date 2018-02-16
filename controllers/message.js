'use strict'

let moment = require('moment');
let mongoosePaginate = require('mongoose-pagination');

let User = require('../models/user');
let Follow = require('../models/follow');
let Message = require('../models/message');

function saveMessage(req, res){
	let params = req.body;	

	if(!params.text || !params.receiver) return res.status(200).send({message: 'Envia los campos necesarios.'});

	let message = new Message();
	message.emitter = req.user.sub;
	message.receiver = params.receiver;
	message.text = params.text;
	message.created_at = moment().unix();
	message.viewed = 'false';

	message.save((err, messageStored) => {
		if (err) return res.status(500).send({message: 'Error en la petición'});

		if(!messageStored) return res.status(404).send({message: 'Error al enviar el mensaje'});

		return res.status(200).send({message: messageStored});
	});
}

function getReceivedMessages(req, res){
	let userId = req.user.sub;
	
	let page = 1;
	if(req.params.page){
		page = req.params.page;
	}

	let itemsPerPage = 4;

	Message.find({receiver: userId}).populate('emitter', 'name surname nick _id image').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total) => {
		if (err) return res.status(500).send({message: 'Error en la petición'});

		if(!messages) return res.status(404).send({message: 'No hay mensajes'});

		return res.status(200).send({
			total: total,
			pages: Math.ceil(total/itemsPerPage),
			messages
		});
	});
}

function getEmmitMessages(req, res){
	let userId = req.user.sub;
	
	let page = 1;
	if(req.params.page){
		page = req.params.page;
	}

	let itemsPerPage = 4;

	Message.find({emitter: userId}).populate('emitter receiver', 'name surname nick _id image').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total) => {
		if (err) return res.status(500).send({message: 'Error en la petición'});

		if(!messages) return res.status(404).send({message: 'No hay mensajes'});

		return res.status(200).send({
			total: total,
			pages: Math.ceil(total/itemsPerPage),
			messages
		});
	});
}

function getUnviewedMessages(req, res){
	let userId = req.user.sub;

	Message.count({receiver:userId, viewed:'false'}).exec((err, count) => {
		if (err) return res.status(500).send({message: 'Error en la petición'});

		return res.status(200).send({
			'unviewed': count
		});
	});
}

function setViewedMessages(req, res){
	let userId = req.user.sub;

	Message.update({receiver:userId, viewed:'false'}, {viewed: 'true'}, {"multi":true}, (err, messageUpdated) => {
		if (err) return res.status(500).send({message: 'Error en la petición'});
		
		return res.status(200).send({messages: messageUpdated});
	});
}

module.exports = {
	saveMessage,
	getReceivedMessages,
	getEmmitMessages,
	getUnviewedMessages,
	setViewedMessages
}