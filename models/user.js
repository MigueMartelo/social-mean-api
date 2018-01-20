'use strict'

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let UserSchema = Schema({
		name:String,
		surname:String,
		nick:String,
		email:String,
		password:String,
		role:String,
		image:String
});

module.exports = mongoose.model('User', UserSchema);