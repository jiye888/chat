const authService = require('../service/authService');
const memberService = require('../service/memberService');
const auth = require('../model/Auth');
const jwt = require('jsonwebtoken');
const CustomError = require('../error/CustomError.js');

const logIn = async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const loginJWT = await authService.logIn(email, password);

        res.cookie('JWT_auth', loginJWT.accessToken, {
            httpOnly: true,
            //secure: true, //https 환경에서만 전송
            sameSite: 'Strict', // csrf 방지
            maxAge: 30 * 60 * 1000,
        });

        res.cookie('JWT_auth_refresh', loginJWT.refreshToken, {
            httpOnly: true,
            //secure: true,
            sameSite: 'Strict',
            maxAge: 10 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({success: true, message: '로그인에 성공했습니다.', accessToken: loginJWT.accessToken, memberId: loginJWT.memberId});
    } catch (err) {
        console.error('로그인 오류: ', err);
        res.clearCookie('JWT_auth_refresh');
        res.clearCookie('JWT_auth');
        next(err);
    }
}

const logOut = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('=')[1];
        await authService.logOut(token);
        res.clearCookie('JWT_auth');
        res.clearCookie('JWT_auth_refresh');
        return res.status(200).json({message: '로그아웃이 완료되었습니다.'});
    } catch(err) {
        console.error('로그아웃 오류: ', err);
        next(err);
    }
}

async function refreshToken(req, res, next) {
    try {
        const refreshToken = req.cookies.JWT_auth_refresh;
        if (!refreshToken) return next(new CustomError('MISSING_TOKEN'));

        const email = await auth.getEmail(refreshToken);
        if (!email) return next(new CustomError('INVALID_TOKEN')); // expiredToken
        
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_R);
            const member = await memberService.getMemberByEmail(payload.email);
            const newToken = authService.generateAccessToken(member);
            res.cookie('JWT_auth', newToken, {
                httpOnly: true,
                //secure: true,
                sameSite: 'Strict',
                maxAge: 30 * 60 * 1000,
            });

        return res.status(200).json({success: true, message: 'Access Token 갱신이 완료되었습니다.', memberId: member.id, accessToken: newToken});
    } catch (err) {
        console.error('refresh token 갱신 오류: ', err);
        res.clearCookie('JWT_auth_refresh');
        res.clearCookie('JWT_auth');
        if (err?.name === 'TokenExpiredError') {
            return next(new CustomError('TOKEN_EXPIRED'));
        }
        if (err?.name === 'JsonWebTokenError') {
            return next(new CustomError('INVALID_TOKEN'));
        }
        next(err);
    }
}

async function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split('=')[1];
    if (!token) return next(new CustomError('MISSING_TOKEN'));
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET_A);
        const member = await memberService.getMemberByEmail(payload.email);
        if (!member) return next(new CustomError('USER_NOT_FOUND'));
        req.member = payload;
        next();
    } catch (err) {
        console.error('인증 오류: ', err);
        if (err.name === 'TokenExpiredError') {
            return next(new CustomError('TOKEN_EXPIRED'));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new CustomError('INVALID_TOKEN'));
        }
        next(err);
    }
}

module.exports = {logIn, logOut, refreshToken, authenticateToken};