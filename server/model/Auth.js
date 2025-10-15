const redis = require('../db/redis');

async function saveToken(token, email) {
    await redis.set(token, email, 'EX', 60 * 60 * 24 * 10);
}

async function getEmail(token) {
    return await redis.get(token);
}

const Auth = {saveToken, getEmail};

module.exports = Auth;