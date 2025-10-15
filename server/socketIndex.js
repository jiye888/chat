const chatService = require('./service/chatService');
const chatRoomService = require('./service/chatRoomService');
const {onlineMembers} = require('./onlineMembers');

module.exports = function socketConnection(io, socket) {
    chatService.sendMessage(io, socket);
    chatService.addNewRead(io, socket);
    chatService.deleteMessage(io, socket);
    chatRoomService.joinChatRoom(io, socket);
    chatRoomService.leaveChatRoom(io, socket);

    socket.on('disconnect', () => {
        delete onlineMembers[socket.member.id];
        console.log(`${socket.member.id} disconnected`);
    });
};