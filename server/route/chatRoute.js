const express = require('express');
const router = express.Router();
const chatController = require('../controller/chatController');
const chatRoomController = require('../controller/chatRoomController');
const {authenticateToken} = require('../controller/authController');

router.get('/:roomId/message', authenticateToken, chatController.getMessage);
router.get('/show/:memberId', authenticateToken, chatRoomController.showChatRoom);
router.post('/create', authenticateToken, chatRoomController.createChatRoom);
router.delete('/:roomId/delete', authenticateToken, chatRoomController.deleteChatRoom);
router.post('/:roomId/invite', authenticateToken, chatRoomController.inviteRoom);
router.patch('/:roomId/delegate', authenticateToken, chatRoomController.setAdmin);
router.delete('/:roomId/withdraw', authenticateToken, chatRoomController.withdrawChatRoom);
router.get('/:roomId/members', authenticateToken, chatRoomController.getMembers);
router.patch('/:roomId/change_name', authenticateToken, chatRoomController.changeRoomName);
router.get('/:roomId/search', authenticateToken, chatController.searchMessage);
router.get('/:roomId', authenticateToken, chatRoomController.getChatRoom);

module.exports = router;