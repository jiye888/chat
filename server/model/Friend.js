const mongoose = require('../db/mongoose');

const Friend = new mongoose.Schema({
    member1: {type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true},
    member2: {type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true},
    member1Info: {
        nickname: {type: String, default: null},
        isFavorite: {type: Boolean, default: false},
    },
    member2Info: {
        nickname: {type: String, default: null},
        isFavorite: {type: Boolean, default: false},
    },
    acceptedAt: {
        type: Date, default: Date.now,
    },
});

module.exports = mongoose.model('Friend', Friend);