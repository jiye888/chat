const chatService = require('../service/chatService');
const CustomError = require('../error/CustomError');

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

module.exports = {getMessage, searchMessage};