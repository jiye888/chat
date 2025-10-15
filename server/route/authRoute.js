const express = require('express');
const authController = require('../controller/authController');

const router = express.Router();

router.post('/login', authController.logIn);
router.post('/logout', authController.logOut);
router.get('/me', authController.authenticateToken, (req, res) => {
    res.json({member: req.member});
});
router.post('/refresh', authController.refreshToken);

module.exports = router;