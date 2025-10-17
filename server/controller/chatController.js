const chatService = require('../service/chatService');
const CustomError = require('../error/CustomError');
const {onlineMembers} = require('../onlineMembers');

async function getMessage(req, res, next) {
    try {
        const memberId = req.member.id;
        const {roomId} = req.params;
        const {lastMessageId, direction} = req.query;
        const result = await chatService.getMessage(roomId, memberId, lastMessageId, 15, direction);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('메시지 조회 오류: ', err);
        next(err);
    }
}

async function searchMessage(req, res, next) {
    try {
        const memberId = req.member.id;
        const roomId = req.params.roomId;
        const {keyword, lastMessageId} = req.query;
        const nullableId = lastMessageId ?? null;
        const result = await chatService.searchMessage(roomId, memberId, keyword, 20, nullableId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('메시지 검색 오류: ', err);
        next(err);
    }
}

async function sendMessage(io, socket) {
    socket.on('save-message', async ({roomId, message}) => {
        try {
            const memberId = socket.member.id;
            const {chat, chatroom} = await chatService.saveMessageAndUpdateRead(memberId, roomId, message);
            const fullChat = await chatService.getMessageForSending(chat, chatroom);

            io.to(roomId).emit('send-message', {
                chat: fullChat,
            });
            
            //메시지 전송시 개별 회원 채팅방 목록에 preview 전달
            chatroom.members.forEach(m => {
                const socketId = onlineMembers[m.member._id.toString()];
                if (socketId) {
                    io.to(socketId).emit('send-preview', {roomId, message});
                }
            });
            
        } catch (err) {
            console.error('메시지 전송 오류: ', err);
            next(err);
        }
    });
    
}

async function addNewRead(io, socket) {
    socket.on('add-read', async ({roomId, chat}) => {
        try {
            const memberId = socket.member.id;
            const unread = await chatService.addNewRead(memberId, roomId, chat);
            io.to(roomId).emit('update-read', {chatId: chat._id, unread});
        } catch (err) {
            console.error('새 메시지 읽음 처리 오류: ', err);
            next(err);
        }
    });
}

async function deleteMessage(io, socket) {
    socket.on('delete-message', async ({roomId, messageId}) => {
        try {
            await chatService.deleteMessage(messageId);
            io.to(roomId).emit('update-deleted', messageId);
        } catch (err) {
            console.error('메시지 삭제 처리 오류: ', err);
            next(err);
        }
    });
}

module.exports = {getMessage, searchMessage, sendMessage, addNewRead, deleteMessage};