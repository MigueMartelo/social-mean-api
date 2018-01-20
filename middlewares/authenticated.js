'use strict'

let jwt = require('jwt-simple');
let moment = require('moment');
let secret = 'claveSecreta_curso_desarrollar_red_angular';

exports.ensureAuth = function(req, res, next){

	if(!req.headers.authorization){
		return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
	}

	let token = req.headers.authorization.replace(/['"]+/g, '');

	try{
		let payload = jwt.decode(token, secret);

		if(payload.exp <= moment().unix()){
			return res.status(401).send({
				message: 'El token ha expirado'
			});
		}
	}catch(ex){
		return res.status(404).send({
				message: 'El token no es válido'
			});
	}

	req.user = payload;

	next();

}