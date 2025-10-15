const chatRoomService = require('../service/chatRoomService');
const {getIO} = require('../socket');
const CustomError = require('../error/CustomError');

async function createChatRoom(req, res, next) {
    try {
        const memberId = req.member.id;
        const roomName = req.body.roomName;
        const newChatRoom = await chatRoomService.createChatRoom(memberId, roomName);
        return res.status(200).json({
            success: true,
            message: '채팅방 생성 성공',
            roomId: newChatRoom._id
        });
    } catch (err) {
        console.error('채팅방 생성 오류: ', err);
        next(err);
    }
}

async function showChatRoom(req, res, next) {
    try {
        const memberId = req.member.id;
        const rooms = await chatRoomService.showChatRoom(memberId);

        return res.status(200).json({
            success: true,
            message: '채팅방 목록 조회 성공',
            rooms: rooms,
        });
    } catch (err) {
        console.error('채팅방 조회 오류: ', err);
        next(err);
    }
}

async function deleteChatRoom(req, res, next) {
    try {
        const memberId = req.member.id;
        const roomId = req.params.roomId;
        const result = await chatRoomService.deleteChatRoom(memberId, roomId);
        const io = getIO();
        io.to(roomId).emit('room-deleted', {deletedRoomId: roomId});
        io.in(roomId).socketsLeave(roomId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('채팅방 삭제 오류: ', err);
        next(err);
    }
}

async function inviteRoom(req, res, next) {
    try {
        const memberId = req.member.id;
        const roomId = req.params.roomId;
        const inviteList = req.body.inviteList;
        const result = await chatRoomService.inviteRoom(memberId, roomId, inviteList);
        if (result.success) {
            const io = getIO();
            for (const invite of inviteList) { //if onlineMembers 사용?
                io.to(invite).emit('invite-room');
            }
            const systemMessages = result.systemMessages;
            io.to(roomId).emit('invite-notice', {systemMessages});
            return res.status(200).json({success: true, message: '채팅방 초대를 완료했습니다.'});
        }
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('채팅방 초대 오류: ', err);
        next(err);
    }
}

async function setAdmin(req, res, next) {
    try {
        const memberId = req.member.id;
        const receiver = req.body.receiver;
        const roomId = req.params.roomId;
        const result = await chatRoomService.setAdmin(memberId, receiver, roomId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('관리자 변경 오류: ', err);
        next(err);
    }
}

async function withdrawChatRoom(req, res, next) {
    try {
        const memberId = req.member.id.toString();
        const roomId = req.params.roomId.toString();
        const result = await chatRoomService.withdrawChatRoom(memberId, roomId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('채팅방 퇴장 오류: ', err);
        next(err);
    }
}

async function getMembers(req, res, next) {
    try {
        const memberId = req.member.id;
        const roomId = req.params.roomId;
        const result = await chatRoomService.getMembers(memberId, roomId);

        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('채팅방 회원 조회 오류: ', err);
        next(err);
    }
}

async function changeRoomName(req, res, next) {
    try {
        const memberId = req.member.id;
        const roomId = req.params.roomId;
        const newName = req.body.newName;
        const result = await chatRoomService.changeRoomName(memberId, roomId, newName);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('채팅방 이름 변경 오류: ', err);
        next(err);
    }
}

async function getChatRoom(req, res, next) {
    try {
        const memberId = req.member.id;
        const roomId = req.params.roomId;
        const result = await chatRoomService.getChatRoom(memberId, roomId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('채팅방 조회 오류: ', err);
        next(err);
    }
}

module.exports = {createChatRoom, showChatRoom, deleteChatRoom, inviteRoom, setAdmin,
    withdrawChatRoom, getMembers, changeRoomName, getChatRoom};