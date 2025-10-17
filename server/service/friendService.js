const Friend = require('../model/Friend');
const Member = require('../model/Member');
const FriendRequest = require('../model/FriendRequest');
const mongoose = require('../db/mongoose');
const CustomError = require('../error/CustomError');

async function sendFriendRequest(sender, receiver) {
    try {
        if (sender === receiver) throw new CustomError('BAD_REQUEST', '자신에게는 요청할 수 없습니다.');

        const existing = await Friend.findOne({sender: sender, receiver: receiver});
        if (existing) throw new CustomError('USER_CONFLICT', '이미 요청을 보냈습니다.');

        const reverse = await Friend.findOne({sender: receiver, receiver: sender});
        if (reverse) throw new CustomError('USER_CONFLICT', '상대방이 이미 요청을 보냈습니다.');

        const request = new FriendRequest({sender: sender, receiver: receiver});
        await request.save();

        return {success: true, message: '친구 요청에 성공했습니다.', request};
    } catch (err) {
        console.error('친구 요청 전송 오류: ', err);
        throw err;
    }
}

async function countUnreadRequest(memberId) {
    const count = await FriendRequest.countDocuments({
        receiver: memberId,
        isSeen: false,
    });
    return count;
}

async function acceptFriendRequest(memberId, requestId) {
    const request = await FriendRequest.findOne({_id: requestId});
    if (!request) throw new CustomError('NOT_FOUND', '친구 요청을 찾을 수 없습니다.');
    if (request.receiver.toString() !== memberId.toString())
        throw new CustomError('FORBIDDEN', '요청에 접근할 권한이 없습니다.');
    
    //member1, member2 순서 정렬해서 문서 두 개 생성되는 것 방지하기
    const [member1, member2] = [request.sender, request.receiver].sort();

    try {
        await Promise.all([
            (async () => {
                const friend = await new Friend({member1: member1, member2: member2}).save();
                await Member.findByIdAndUpdate(
                {_id: member1},
                {$addToSet: {friends: friend}});
                await Member.findByIdAndUpdate(
                {_id: member2},
                {$addToSet: {friends: friend}});
            })(),
            (async () => {
                await request.deleteOne();
            })()
        ]);
    } catch (err) {
        console.error('친구 요청 수락 오류: ', err);
        throw err;
    }

    return {success: true, message: '친구 요청을 수락하였습니다.'};
}

async function rejectFriendRequest(memberId, requestId) {
    const request = await FriendRequest.findById(requestId);

    if (!request) throw new CustomError('NOT_FOUND', "친구 요청을 찾을 수 없습니다.");
    if (request.receiver.toString() !== memberId) throw new CustomError('FORBIDDEN', '요청을 거절할 권한이 없습니다.');

    await FriendRequest.findByIdAndDelete(requestId);
    return {success: true, message: '친구 요청이 거절되었습니다.'};
}

async function cancelFriendRequest(memberId, requestId) {
    const request = await FriendRequest.findOne({_id: requestId});
    if (!request) throw new CustomError('NOT_FOUND', '친구 요청을 찾을 수 없습니다.');
    if (request.sender.toString() !== memberId)
        throw new CustomError('FORBIDDEN', '요청을 취소할 권한이 없습니다.');
    await request.deleteOne();
    
    return {success: true, message: '친구 요청 취소가 완료되었습니다.', receiver: request.receiver};
}

async function setNickName(memberId, friendId, nickname) {
    try {
        const [member1, member2] = [memberId, friendId].sort();
        
        const friend = await Friend.findOne({member1: member1, member2: member2});
        if (!friend) throw new CustomError('NOT_FOUND', '친구 정보를 찾을 수 없습니다.');

        const nicknameField = memberId.toString() === friend.member1.toString() ? 'member1Info.nickname'
            : 'member2Info.nickname';

        const updatedFriend = await Friend.findByIdAndUpdate(friend._id,
            {$set: {[nicknameField] : nickname}},
            {new: true}
        );

        return {success: true, message: '친구 별명 설정 완료', updatedFriend};
    } catch (err) {
        console.error('별명 설정 중 오류 발생: ', err);
        throw err;
    }
}

async function setIsFavorite(memberId, friendId, isFavorite) {
    try {
        const [member1, member2] = [memberId, friendId].sort();
        const member1id = mongoose.Types.ObjectId.createFromHexString(member1.toString());
        const member2id = mongoose.Types.ObjectId.createFromHexString(member2.toString());

        const friend = await Friend.findOne({member1: member1id, member2: member2id});
        if (!friend) throw new CustomError('NOT_FOUND', '친구 정보를 찾을 수 없습니다.');

        const favoriteField = memberId.toString() === friend.member1.toString() ? 'member1Info.isFavorite'
            : 'member2Info.isFavorite';

        const updatedFriend = await Friend.findByIdAndUpdate(friend._id,
            {$set: {[favoriteField] : isFavorite}},
            {new: true}
        );

        return {success: true, message: '친구 즐겨찾기 설정 완료', updatedFriend};
    } catch (err) {
        console.error('즐겨찾기 설정 중 오류 발생: ', err);
        throw err;
    }
}

async function showReceivedRequest(memberId) {
    await FriendRequest.updateMany(
        {receiver: memberId, isSeen: false},
        {$set: {isSeen: true}}
    );
    const requests = await FriendRequest.find({receiver: memberId})
        .populate('sender', 'name')
        .lean();
    return {success: true, message: '받은 친구 요청 조회 성공', requests};
}

async function showSentRequest(memberId) {
    const requests = await FriendRequest.find({sender: memberId})
        .populate('receiver', 'name')
        .lean();
    return {success: true, message: '보낸 친구 요청 조회 성공', requests};
}

async function showFriends(memberId) {
    try {
        const memberFriends = await Member.findById(memberId)
            .select('friends')
            .populate({
                path: 'friends',
                populate: [
                    {path: 'member1', select: 'name'},
                    {path: 'member2', select: 'name'}
                ],
            })
            .lean();

        if (!memberFriends.friends)
            return {success: true, message: '친구 목록 조회가 완료되었습니다.', friendList: null};

        const friends = memberFriends.friends;
        
        const friendList = friends.map(friend => {
            const isMember1 = friend.member1._id.toString() === memberId.toString();
            const checkMember = isMember1 ? friend.member2 : friend.member1;
            const myFriend = isMember1 ? friend.member1Info : friend.member2Info;
            
            return {
                _id: checkMember._id,
                name: checkMember.name,
                nickname: myFriend.nickname,
                isFavorite: myFriend.isFavorite,
                acceptedAt: friend.acceptedAt,
            };
        });
        return {success: true, message: '친구 목록 조회가 완료되었습니다.', friendList};
    } catch (err) {
        console.error('친구 목록 조회 오류: ', err);
        throw err;
    }
    
}

async function searchMember(memberId, name, page, limit=20, sortOrder="asc") {
    const pageNum = parseInt(page) || 0;
    const items = parseInt(limit) || 10;

    const sortOrderNum = sortOrder === 'asc' ? 1 : -1;

    if (!name || name.length < 1) throw new CustomError('INVALID_INPUT', '이름을 한 글자 이상 입력해주세요.');

    let query = {};
    query.name = {$regex: name, $options: 'i'};

    const requests = await getRequestIdArray(memberId);

    try {
        const members = await Member.find(query)
            .select('_id name')
            .sort({name: sortOrderNum})
            .skip(pageNum * items)
            .limit(items)
            .exec();

        const memberFriends = await Member.findById(memberId)
            .select('friends')
            .populate('friends', 'member1 member2')
            .lean();

        const friends = memberFriends.friends ? memberFriends.friends : ([]);
        
        const friendArray = friends.map(item => {
            if (!item.friends) return null;
            if (item.friends.member1.toString() === memberId.toString())
                return item.friends.member2._id;
            if (item.friends.member2.toString() === memberId.toString())
                return item.friends.member1._id;
            return null;
        }).filter(Boolean); // falsy 값 제거 위해

        const processed = members.map(member => {
            //const isFriend = member._id.toString() !== memberId &&
                //member.friends.some(friendId => friendId.toString() === memberId.toString());
            const isFriend = member._id.toString() !== memberId &&
                friendArray.includes(member._id);

            const isRequested = requests.includes(member._id.toString());

            return {
                _id: member._id,
                name: member.name,
                isFriend,
                isRequested,
            };
        });

        const total = await Member.countDocuments(query);

        //if (total === 0) return {success: true, message: '조회 가능한 사용자가 없습니다.'};
        return {
            success: true,
            message: '사용자 검색에 성공했습니다.',
            members: processed,
            total,
            hasMore: (pageNum + members.length) < total
        };
    } catch (err) {
        console.error(err);
        throw err;
    }

}

async function unfriend(memberId, friendId) {
    const [member1, member2] = [memberId, friendId].sort();

    const friend = await Friend.findOneAndDelete({member1: member1, member2: member2});
    if (!friend) throw new CustomError('NOT_FOUND', '친구 정보를 찾을 수 없습니다.');
    const memberInfo1 = await Member.findOneAndUpdate(
        {_id: member1}, {$unset: {friends: friend._id}});
    const memberInfo2 = await Member.findOneAndUpdate(
        {_id: member2}, {$unset: {friends: friend._id}});
    return {success: true, message: '친구 해제가 완료되었습니다.'};
}

async function getRequestIdArray(memberId) {
    const field1 = await FriendRequest.find({sender: memberId}).distinct("receiver");
    const field2 = await FriendRequest.find({receiver: memberId}).distinct("sender");
    const fields = [...field1, ...field2];
    const result = fields.map(id => id.toHexString());
    return result;
}

module.exports = {sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
    cancelFriendRequest, setNickName, setIsFavorite, showReceivedRequest, showSentRequest,
    showFriends, searchMember, countUnreadRequest, unfriend};