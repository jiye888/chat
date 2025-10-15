const mongoose = require('../db/mongoose');

const Member = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    password: {type: String, required: true},
    chatroom: [{type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom'}],
    friends: [{type: mongoose.Schema.Types.ObjectId, ref: 'Friend'}],
});

module.exports = mongoose.model('Member', Member);