const Chat = require('../model/Chat');
const ChatRoom = require('../model/ChatRoom');
const mongoose = require('../db/mongoose');
const CustomError = require('../error/CustomError');


//채팅방에 존재하는 사용자인지 확인
async function checkOn(roomId, memberId) {
  const isIn = await ChatRoom.exists({_id: roomId, "members.member": mongoose.Types.ObjectId.createFromHexString(memberId.toString())});
  return isIn;
}

async function saveMessageAndUpdateRead(memberId, roomId, content) {
    try {
        const chat = new Chat({
            sender:memberId, roomId, content,
        });
        await chat.save();

        const chatroom = await ChatRoom.findOneAndUpdate(
            {_id: roomId},
            {$set: {
                'readBy.$[rm].readId': chat._id,
                lastMessage: chat._id,
            }},
            {
                new: true,
                arrayFilters: [{"rm.member": memberId}]
            }
        );

        return {chat, chatroom};
    } catch (err) {
        console.error('메시지 저장 오류: ', err);
        throw err;
    }
}

async function getMessageForSending(chat, chatroom) {
    try {
        await chat.populate('sender', 'id name');
        const chatObj = chat.toObject();
        const unread = countUnread(chat._id, chatroom);
        const fullChat = {...chatObj, unread};

        return fullChat;
    } catch (err) {
        console.error('메시지 전송 전처리 오류: ', err);
        throw err;
    }
}

function countUnread(messageId, chatroom) {
    try {
        const unread = chatroom.readBy.filter(r => {
            if (!r.readId) return true;
            return r.readId < messageId;
        }).length;

        return unread;
    } catch (err) {
        console.error('읽음 상태 조회 오류: ', err);
        throw err;
    }
}

async function getMessage(roomId, memberId, lastMessageId=null, limit=15, direction="before") {
    try {
        const isIn = await checkOn(roomId, memberId);
        if (!isIn) throw new CustomError('FORBIDDEN', '채팅방 조회 권한이 없습니다.');

        //메시지 조회 조건 생성
        if (!roomId) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');

        //채팅방 멤버 조회
        const chatroom = await ChatRoom.findById(roomId);
        if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');

        //메시지 작성자 존재하는지 확인하기 위해
        const memberIdStr = chatroom.members.map(m => m.member._id.toString());

        //메시지가 채팅방 입장 이전인지 이후인지 확인하기 위해
        const memberInfo = chatroom.members.filter(
            m => m.member._id.toString() === memberId.toString());

        let query = {
            roomId,
            time: {$gte: memberInfo[0].joinedAt}
        };

        if (lastMessageId) {
            if (direction === 'before') query._id = {$lt: mongoose.Types.ObjectId.createFromHexString(lastMessageId.toString())};
            else if (direction === 'after') query._id = {$gt: mongoose.Types.ObjectId.createFromHexString(lastMessageId.toString())};
            else if (direction === 'center') query._id = {$eq: mongoose.Types.ObjectId.createFromHexString(lastMessageId.toString())};
        }

        //메시지 조회 및 populate
        const messages = await Chat.find(query)
            .sort({time: direction === 'before' ? -1 : 1})
            .limit(limit + 1)
            .populate({path: 'sender', select: 'name'})
            .populate('roomId');
        
        //messages 내용 없는 경우 처리해주기

        const hasMore = messages.length > limit;
        const slicedMessages = hasMore ? messages.slice(0, limit) : messages;

        if (direction === 'before') slicedMessages.reverse();

        // 읽음 상태 업데이트
        // 가장 아래 있는 최신메시지를 기준으로 업데이트.
        if (!lastMessageId && direction === 'before') {
            const lastestMessageId = messages.length ? messages[messages.length - 1]._id : null;
            if (lastestMessageId) await addRead(roomId, memberId, lastestMessageId);
        }

        //각 메시지에 unread 계산
        //reverse: 보여지는 화면이 아래서 위가 아니라 위에서 아래가 되도록.
        const result = slicedMessages.map(msg => {
            const unread = countUnread(msg._id, chatroom);
            return {
                ...msg.toObject(),
                sender: {
                    _id: msg.sender?._id,
                    name: memberIdStr.includes(msg.sender?._id?.toString()) ? msg.sender.name : '알 수 없는 사용자'
                },
                unread,
            };
        });

        return {
            success: true,
            messages: result,
            hasMore
        };

    } catch (err) {
        console.error('메시지 조회 오류: ', err);
        throw err;
    }
}

async function addRead(roomId, memberId, chatId) {
    try {
        const chatroom = await ChatRoom.findById(roomId);
        if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
        const index = chatroom.readBy.findIndex(r => r.member.toString() === memberId);
        if (index >= 0) {
            const isNew = chatroom.readBy[index].readId < chatId;

            if (isNew) {
                await ChatRoom.updateOne(
                    {_id: roomId, 'readBy.member': memberId},
                    {$set: {'readBy.$.readId': chatId}}
                );
            }
        }
    } catch (err) {
        console.error('읽음 상태 갱신 오류: ', err);
        throw err;
    }
} 

async function addNewRead(memberId, roomId, chat) {
    try {
        await addRead(roomId, memberId, chat._id);
        const chatroom = await ChatRoom.findById(roomId);
        const unread = countUnread(chat._id, chatroom);
        return unread;
    } catch (err) {
        console.error('새 메시지 읽음 처리 오류: ', err);
        throw err;
    }
}

async function deleteMessage(messageId) {
    try {
        await Chat.updateOne(
            {_id: messageId},
            {$set: {'content': '삭제된 메시지입니다.', 'deleted': true}},
        );
    } catch (err) {
        console.error('메시지 삭제 오류: ', err);
        throw err;
    }
}

async function readAll(roomId, memberId) {
    try {
        const chatroom = await ChatRoom.findById(roomId);
        if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
        const isIn = await checkOn(roomId, memberId);
        if (!isIn) throw new CustomError('FORBIDDEN', '채팅방 조회 권한이 없습니다.');
        const chatRead = await ChatRoom.findOne(
            {_id: roomId},
            {readBy: {$elemMatch: {member: memberId}}}
        );

        const lastReadId = chatroom.lastMessage;
        await addRead(roomId, memberId, lastReadId);

        if (chatRead.readBy[0]?.readId) {
            const prevReadId = chatRead.readBy[0]?.readId;
            return {prevReadId, lastReadId};
        } else {
            const joined = await ChatRoom.findOne(
                {_id: roomId},
                {members: {$elemMatch: {member: memberId}}}
            );
            const prevReadId = joined.members[0]?.joinedAt;
            return {prevReadId, lastReadId};
        }
    } catch (err) {
        console.error('읽음 최신 상태 갱신 오류: ', err);
        throw err;
    }
}

async function searchMessage(roomId, memberId, keyword, limit=20, lastMessageId=null) {
    try {
        const isIn = await checkOn(roomId, memberId);
        if (!isIn) throw new CustomError('FORBIDDEN', '채팅방 조회 권한이 없습니다.');

        if (!roomId) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');

        const chatroom = await ChatRoom.findById(roomId);
        if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
        
        const memberInfo = chatroom.members.filter(
                m => m.member._id.toString() === memberId.toString());
        
        let query = {
            roomId: roomId,
            $text: {$search: keyword},
            time: {$gte: memberInfo[0].joinedAt}
        };

        if (lastMessageId) {
            query._id = {$lt: mongoose.Types.ObjectId.createFromHexString(lastMessageId.toString())};
        }

        const searched = await Chat.find(query)
            .sort({time: - 1})
            .limit(limit + 1)
            .exec();

        const result = {message: [], success: true};
        if (searched.length === 0) return result;
        result.hasMore = (searched.length > limit ? true : false);
        const slicedMessages = (result.hasMore ? searched.slice(0, limit) : searched);
        //hasMore 조회해서 prefetch 사용하도록

        const messageLimit = 10;

        for (const s of slicedMessages) {
            const before = await getMessage(roomId, memberId, s._id, messageLimit, 'before');
            const after = await getMessage(roomId, memberId, s._id, messageLimit, 'after');
            const center = await getMessage(roomId, memberId, s._id, 1, 'center');

            const beforeAfter = {before, center, after};

            result.message.push(beforeAfter);
        }

        return result;
    } catch (err) {
        console.error('메시지 검색 오류: ', err);
        throw err;
    }
}

module.exports = {checkOn, saveMessageAndUpdateRead, getMessageForSending,
    getMessage, addNewRead, readAll, deleteMessage, searchMessage};