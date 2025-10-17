const chatController = require('./controller/chatController');
const chatRoomController = require('./controller/chatRoomController');
const {onlineMembers} = require('./onlineMembers');

module.exports = function socketConnection(io, socket) {
    chatController.sendMessage(io, socket);
    chatController.addNewRead(io, socket);
    chatController.deleteMessage(io, socket);
    chatRoomController.joinChatRoom(io, socket);
    chatRoomController.leaveChatRoom(io, socket);

    socket.on('disconnect', () => {
        delete onlineMembers[socket.member.id];
        console.log(`${socket.member.id} disconnected`);
    });
};