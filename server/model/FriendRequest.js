const mongoose = require('../db/mongoose');

const FriendRequest = new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true},
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true},
    createdAt: {type: Date, default: Date.now},
    isSeen: {type: Boolean, default: false},
});

module.exports = mongoose.model('FriendRequest', FriendRequest);