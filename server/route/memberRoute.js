const express = require('express');
const memberController = require('../controller/memberController');
const {authenticateToken} = require('../controller/authController');

const router = express.Router();

router.get('/private', authenticateToken, memberController.getMember);
router.post('/register', memberController.registerMember);
router.patch('/update/name', authenticateToken, memberController.updateName);
router.patch('/update/password', authenticateToken, memberController.updatePassword);
router.post('/delete', authenticateToken, memberController.deleteMember);

module.exports = router;