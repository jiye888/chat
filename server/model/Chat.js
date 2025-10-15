const mongoose = require('../db/mongoose');

const Chat = new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true},
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true},
    content: {type: String, required: true},
    time: {type: Date, required: true, default: Date.now},
    read: [{type: mongoose.Schema.Types.ObjectId, ref: 'Member'}],
    deleted: {type: Boolean, default: false},
    system: {type: Boolean, default: false}
});

Chat.index({content: 'text'});

module.exports = mongoose.model('Chat', Chat);