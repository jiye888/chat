const mongoose = require('../db/mongoose');

const ChatRoom = new mongoose.Schema({
    members: [{
        member: {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
        joinedAt: {type: Date, default: Date.now},
    }],
    name: {type: String, require: true},
    admin: {type:mongoose.Schema.Types.ObjectId, ref: 'Member', required: true},
    readBy: [{
        member: {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
        readId: {type: mongoose.Schema.Types.ObjectId, ref: 'Chat'},
    }],
    lastMessage: {type: mongoose.Schema.Types.ObjectId, ref: 'Chat'},
});

module.exports = mongoose.model('ChatRoom', ChatRoom);
