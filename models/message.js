'use strict'

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let MessageSchema = Schema({
		emitter: { type: Schema.ObjectId, ref:'User'},
		receiver: { type: Schema.ObjectId, ref:'User'},
		text: String,
		created_at: String,
		viewed: String
});

module.exports = mongoose.model('Message', MessageSchema);