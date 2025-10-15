const express = require('express');
const friendController = require('../controller/friendController');
const {authenticateToken} = require('../controller/authController');

const router = express.Router();

router.get('/requests/received', authenticateToken, friendController.showReceivedRequest);
router.get('/requests/sent', authenticateToken, friendController.showSentRequest);
router.get('/list', authenticateToken, friendController.showFriends);
router.post('/:requestId/accept', authenticateToken, friendController.acceptFriendRequest);
router.post('/:requestId/reject', authenticateToken, friendController.rejectFriendRequest);
router.post('/:requestId/cancel', authenticateToken, friendController.cancelFriendRequest);
router.patch('/:friendId/nickname', authenticateToken, friendController.setNickName);
router.patch('/:friendId/favorite', authenticateToken, friendController.setIsFavorite);
router.get('/search', authenticateToken, friendController.searchMember);
router.post('/send/request', authenticateToken, friendController.sendFriendRequest);
router.get('/request/count', authenticateToken, friendController.countUnreadRequest);
router.delete('/:friendId/unfriend', authenticateToken, friendController.unfriend);

module.exports = router;