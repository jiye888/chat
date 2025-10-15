let io;

function init(server) {
    const {Server} = require('socket.io');
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:3033', 'https://localhost:3033'], //React 주소
            methods: ['GET', 'POST', 'DELETE', 'PATCH'],
            credentials: true,
        },
    });
    return io;
}

function getIO() {
    if (!io) throw new Error('socket.io가 초기화되지 않았습니다.');
    return io;
}

module.exports = {init, getIO};