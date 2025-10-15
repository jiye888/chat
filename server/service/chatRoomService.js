const mongoose = require('../db/mongoose');
const ChatRoom = require('../model/ChatRoom');
const Chat = require('../model/Chat');
const Member = require('../model/Member');
const Friend = require('../model/Friend');
const chatService = require('./chatService');
const {getIO} = require('../socket');
const CustomError = require('../error/CustomError');

async function createChatRoom(memberId, roomName) {
  try {
    const newChatRoom = await ChatRoom.create({
      members: [{member: memberId}],
      name: roomName,
      admin: memberId,
      readBy: [{member: memberId, readId: null}],
      lastMessage: null,
    });
    if (!newChatRoom) throw new CustomError('INTERNAL_SERVER_ERROR', '채팅방 생성에 오류가 발생했습니다.');
    await Member.updateOne(
      {_id: memberId},
      {$push: {'chatroom': newChatRoom._id}}
    );
    return newChatRoom;
  } catch (err) {
    console.error('채팅방 생성 오류: ', err);
    throw err;
  }
  
}

//초대입장
async function inviteRoom(memberId, roomId, inviteList) {
  try {
    //알림은 controller에서 처리 && 메서드 내용 수정할 것... inviteList
    const chatroom = await ChatRoom.findById(roomId);
    if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');

    const isIn = await chatService.checkOn(roomId, memberId);
    if (!isIn) throw new CustomError('FORBIDDEN', "채팅방에 속하지 않는 회원입니다.");

    if (!inviteList || inviteList.length === 0) {
      throw new CustomError('USER_NOT_FOUND', "초대할 회원이 없습니다.");
    }

    const newMembers = inviteList.filter(
      (inviteId) => !chatroom.members.some((exist) => exist._id.toString() === inviteId.toString())
    );
    
    if (newMembers.length === 0) {
      throw new CustomError('USER_CONFLICT', "이미 초대된 회원입니다.");
    }

    const systemMessages = [];

    await Promise.all(
      newMembers.map(async inviteId => {
        chatroom.members.push({member: inviteId});
        chatroom.readBy.push({member: inviteId, readId: chatroom.lastMessage});
        const member = await Member.findByIdAndUpdate(
          {_id: inviteId},
          {$push: {'chatroom': roomId}},
          {new: true}
        );
        const systemMessage = await Chat.create({
          sender: global.SYSTEM_MEMBER_ID,
          roomId: roomId,
          content: `${member.name}님께서 초대되었습니다.`,
          system: true
        });
        systemMessages.push(systemMessage);
      }),
      await chatroom.save()
    );
    return {success: true, message: "새로운 회원 초대에 성공했습니다.", systemMessages};
  } catch (err) {
      console.error('채팅방 초대 오류: ', err);
      throw err;
  }
}

//소속된 채팅방 입장
async function joinChatRoom(io, socket) {
  socket.on('join-room', async ({roomId}) => {
    socket.join(roomId);
    const io = getIO();
    const memberId = socket.member.id;
    const readInfo = await chatService.readAll(roomId, memberId);
    io.to(roomId).emit('update-read-all', {joinedId: memberId, readInfo});
  });
}

// 채팅방 삭제(s)

async function deleteChatRoom(memberId, roomId) {
  try {
    const chatroom = await ChatRoom.findById(roomId);
    if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
    if (chatroom.admin.toString() !== memberId.toString())
      throw new CustomError('FORBIDDEN');
    for (let i=0; i<chatroom.members.length; i++) {
      const memberId = chatroom.members[i].member;
      
      await Member.updateOne(
        {_id: memberId},
        {$pull: {'chatroom': roomId}}
      );
    }
    await chatroom.deleteOne();
    return {success: true, message: "채팅방이 삭제되었습니다."};
  } catch (err) {
    console.error('채팅방 삭제 오류: ', err);
    throw err;
  }
}

async function setAdmin(sender, receiver, roomId) {
  //sender가 현재 admin인지 확인하기
  //receiver가 현재 방에 있는지 확인하기
  try {
    const chatroom = await ChatRoom.findById(roomId);

    if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
    if (chatroom.admin.toString() !== sender.toString()) throw new Error("관리자 권한이 없습니다.");

    const isIn = await chatService.checkOn(roomId, receiver);
    if (!isIn) throw new CustomError('FORBIDDEN', "채팅방에 속해있지 않은 회원입니다.");

    chatroom.admin = receiver;
    await chatroom.save();
    const io = getIO();
    io.to(roomId).emit('refresh-members');
    return {success: true, message: "관리자 권한이 위임되었습니다."};
  } catch (err) {
    console.error("관리 권한 위임 중 오류 발생: ", err);
    throw err;
  }
}

//일시 퇴장
async function leaveChatRoom(io, socket) {
  socket.on('leave-room', async ({roomId}) => {
    socket.leave(roomId);
  });
}

//영구 퇴장
async function withdrawChatRoom(memberId, roomId) {
  const leftMember = await Member.findById(memberId);
  if (!leftMember) throw new CustomError('USER_NOT_FOUND', "회원 정보를 찾을 수 없습니다.");
  const isIn = await chatService.checkOn(roomId, memberId);
  if (!isIn) throw new CustomError('FORBIDDEN', "채팅방에 속하지 않는 회원입니다.");
  const chatroom = await ChatRoom.findById(roomId);
  if (memberId.toString() === chatroom.admin.toString() && chatroom.members.length > 1)
    throw new CustomError('REQUEST_CONFLICT', '퇴장 전 관리자 권한을 위임해주세요.');

  await Member.updateOne(
    {_id: memberId},
    {$pull: {"chatroom": roomId}}
  );

  await ChatRoom.updateOne(
    {_id: roomId},
    {$pull: {members: {member: memberId}}}
  );

  const remainingMembers = await chatroom
    .populate({
      path:"members",
      select: "name"
    });
    
  if (remainingMembers.members.length === 0) {
    await ChatRoom.deleteOne({_id: roomId});
  } else {
    const systemMessage = await Chat.create({
      sender: global.SYSTEM_MEMBER_ID,
      roomId: roomId,
      content: `${leftMember.name}님께서 퇴장하셨습니다.`,
      system: true
    });
    const io = getIO();
    io.to(roomId).emit('leave-notice', {systemMessage});
  }
  return {success: true, message: "채팅방 퇴장이 완료되었습니다."};
}

//채팅방 목록
async function showChatRoom(memberId) {
  try {
    const member = await Member.findById(memberId);
    if (!member) throw new CustomError('USER_NOT_FOUND');
    const roomIds = member?.chatroom || [];
    
    if (roomIds.length < 1) return [];

    const rooms = await Promise.all(
      roomIds.map(async (id) => {
        const room = await ChatRoom.findById(id)
          .select('members name admin readBy lastMessage')
          .populate({
            path: 'members',
            select: 'name'
          })
          .populate({
            path: 'readBy.member',
            select: 'name'
          })
          .populate({
            path: 'readBy.readId',
            select: 'time'
          })
          .populate({
            path: 'lastMessage',
            select: 'content time'
          })
          .lean();

        const my = room.members.find(m => m.member.toString() === memberId.toString());
        const joinedAt = my?.joinedAt || new Date(0);

        const lastMessage = room.lastMessage;

        if (!lastMessage) {
          //마지막 메시지 없을 때
          const sortKey = joinedAt;
          const unread = false;
          return {...room, lastMessage: "", sortKey, unread};
        } else if(joinedAt > lastMessage.time) {
          //마지막 메시지가 입장 이전일 때 && 입장 이후로 새 메시지 없을 때
          const sortKey = joinedAt;
          const unread = false;
          return {...room, lastMessage: "", sortKey, unread};
        } else {
          //마지막 메시지가 입장 이후일 때
          const sortKey = lastMessage.time;
          const myRead = room.readBy.find(r => r.member._id.toString() === memberId.toString());
          const unread = myRead.readId < lastMessage._id;
          return {...room, lastMessage: lastMessage.content, sortKey, unread};
        }
      })
    );

    return rooms.sort((a, b) => new Date(b.sortKey) - new Date(a.sortKey));
  } catch (err) {
    console.error(err);
    throw err;
  }
}


//채팅방 참여자 조회
async function getMembers(memberId, roomId) {
  try {
    const chatroom = await ChatRoom.findById(roomId)
      .populate({
        path: 'members.member',
        select: '_id name',
      })
      .lean();
    if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
    const isIn = await chatService.checkOn(roomId, memberId);
    if (!isIn) throw new CustomError('FORBIDDEN', '참여자 조회 권한이 없습니다.');

    /*
    const memberList = chatroom.members.filter(m => m.member)
      .map(m => ({_id: m.member._id, name: m.member.name}));*/

    const memberList = await Promise.all(
      chatroom.members.filter(m => m.member).map(async m => {
        const sorted = [memberId, m.member._id].sort();
        const friend = await Friend.findOne({
          member1: sorted[0],
          member2: sorted[1],
        });

        let displayName = m.member.name;

        if (friend) {
          if (friend.member1.equals(memberId)) {
            displayName = friend.member2Info?.nickname || m.member.name;
          } else if (friend.member2.equals(memberId)) {
            displayName = friend.member1Info?.nickname || m.member.name;
          }
        }

        return {
          _id: m.member._id,
          name: displayName,
        };
      })
    );

    return {success: true,
      members: memberList,
      admin: chatroom.admin,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function changeRoomName(memberId, roomId, newName) {
  try {
    const chatroom = await ChatRoom.findOne({_id: roomId});
    if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
    if (chatroom.admin._id.toString() !== memberId.toString())
     throw new CustomError('FORBIDDEN', '채팅방 이름 수정 권한이 없습니다.');
    await ChatRoom.updateOne(
      {_id: roomId},
      {name: newName}
    );
    return {success: true, message: '채팅방 이름 변경이 완료되었습니다.'};
  } catch (err) {
    console.error('채팅방 이름 변경 오류: ', err);
    throw err;
  }
}

async function getChatRoom(memberId, roomId) {
  try {
    const chatroom = await ChatRoom.findOne({_id: roomId});
    if (!chatroom) throw new CustomError('NOT_FOUND', '채팅방 정보를 찾을 수 없습니다.');
    const isIn = await chatService.checkOn(roomId, memberId);
    if (!isIn) throw new CustomError('FORBIDDEN', '참여자 조회 권한이 없습니다.');
    const room = {name: chatroom.name, admin: chatroom.admin};
    return {success: true, message: '채팅방 조회를 완료했습니다.', room: room};
  } catch (err) {
    console.error('채팅방 조회 오류: ', err);
    throw err;
  }
}

module.exports = {createChatRoom, inviteRoom, joinChatRoom, deleteChatRoom, setAdmin,
   leaveChatRoom, withdrawChatRoom, showChatRoom, getMembers, changeRoomName, getChatRoom};