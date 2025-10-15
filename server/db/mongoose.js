const mongoose = require('mongoose');
const path = require('path');
require ('dotenv').config({path: path.join(__dirname, '.env')});

async function connectMongoose() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB Error: ', err);
    }
}

connectMongoose();

module.exports = mongoose;
