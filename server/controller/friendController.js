const friendService = require('../service/friendService');
const {getIO} = require('../socket');
const CustomError = require('../error/CustomError');

async function showFriends(req, res, next) {
    try {
        const memberId = req.member.id;
        const result = await friendService.showFriends(memberId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 목록 조회 오류: ', err);
        next(err);
    }
}

async function acceptFriendRequest(req, res, next) {
    try {
        const memberId = req.member.id;
        const requestId = req.params.requestId;
        const result = await friendService.acceptFriendRequest(memberId, requestId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 요청 수락 오류: ', err);
        next(err);
    }
}

async function rejectFriendRequest(req, res, next) {
    try {
        const memberId = req.member.id;
        const requestId = req.params.requestId;
        const result = await friendService.rejectFriendRequest(memberId, requestId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 요청 거절 오류: ', err);
        next(err);
    }
}

async function cancelFriendRequest(req, res, next) {
    try {
        const memberId = req.member.id;
        const requestId = req.params.requestId;
        const result = await friendService.cancelFriendRequest(memberId, requestId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 요청 취소 오류: ', err);
        next(err);
    }
}

async function setNickName(req, res, next) {
    try {
        const memberId = req.member.id;
        const friendId = req.params.friendId;
        const nickname = req.body.nickname;
        const result = await friendService.setNickName(memberId, friendId, nickname);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 별명 설정 오류: ', err);
        next(err);
    }
}

async function setIsFavorite(req, res, next) {
    try {
        const memberId = req.member.id;
        const friendId = req.params.friendId;
        const isFavorite = req.body.isFavorite;
        const result = await friendService.setIsFavorite(memberId, friendId, isFavorite);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 즐겨찾기 설정 완료: ', err);
        next(err);
    }
}

async function showReceivedRequest(req, res, next) {
    try {
        const memberId = req.member.id;
        const result = await friendService.showReceivedRequest(memberId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('받은 친구 요청 조회 오류: ', err);
        next(err);
    }
}

async function showSentRequest(req, res, next) {
    try {
        const memberId = req.member.id;
        const result = await friendService.showSentRequest(memberId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('보낸 친구 요청 조회 오류: ', err);
        next(err);
    }
}

async function searchMember(req, res, next) {
    try {
        const memberId = req.member.id;
        const {name, page} = req.query;
        const limit = parseInt(req.query.limit, 10) || 20;
        const sortOrder = req.query.sortOrder || 'asc';
        const result = await friendService.searchMember(memberId, name, page, limit, sortOrder);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('사용자 검색 오류: ', err);
        next(err);
    }
}

async function sendFriendRequest(req, res, next) {
    try {
        const memberId = req.member.id;
        const receiver = req.body.receiver;
        const result = await friendService.sendFriendRequest(memberId, receiver);
        const unread = await friendService.countUnreadRequest(receiver);
        const io = getIO();
        io.to(receiver).emit('friend-request-alarm', {unread});
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 요청 전송 오류: ', err);
        next(err);
    }
}

async function countUnreadRequest(req, res, next) {
    try {
        const memberId = req.member.id;
        const result = await friendService.countUnreadRequest(memberId);
        return res.status(200).json({unread: result});
    } catch (err) {
        console.error('친구 요청 알림 오류: ', err);
        next(err);
    }
}

async function unfriend(req, res, next) {
    try {
        const memberId = req.member.id;
        const friendId = req.params.friendId;
        const result = await friendService.unfriend(memberId, friendId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('친구 헤제 오류: ', err);
        next(err);
    }
}

module.exports = {showFriends, acceptFriendRequest, rejectFriendRequest,
    cancelFriendRequest, setNickName, setIsFavorite, showReceivedRequest,
    showSentRequest, searchMember, sendFriendRequest, countUnreadRequest, unfriend
};