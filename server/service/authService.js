const bcrypt = require('bcrypt');
const Member = require('../model/Member');
const auth = require('../model/Auth');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');
const path = require('path');
const CustomError = require('../error/CustomError');
require ('dotenv').config({path: path.join(__dirname, '.env')});

async function generateRefreshToken(member) {
    const refreshToken = jwt.sign(
        {id: member.id, email: member.email},
        process.env.JWT_SECRET_R,
        {expiresIn: '10d'}
    );

    await auth.saveToken(refreshToken, member.email);
    return refreshToken;
}

function generateAccessToken(member) {
    return jwt.sign(
        {id: member.id, email: member.email},
        process.env.JWT_SECRET_A,
        {expiresIn: '30m'}
    );
}

const comparePW = async (inputPassword, existPassword) => {
    if (inputPassword) {
        const isPassword = await bcrypt.compare(inputPassword, existPassword);
        if (!isPassword) throw new CustomError('INVALID_CREDENTIALS');
        return isPassword;
    } else {
        throw new CustomError('INVALID_INPUT', '비밀번호를 입력해주세요.');
    }
}

const logIn = async (email, password) => {
    try {
        if (email.toString() === 'system@connechat.com') // system id
            throw new CustomError('INVALID_CREDENTIALS');
        const existMember = await Member.findOne({email: email});
        if (!existMember) throw new CustomError('USER_NOT_FOUND');
        const memberId = existMember.id;
        await comparePW(password, existMember.password);
        const refreshToken = await generateRefreshToken(existMember);
        const accessToken = generateAccessToken(existMember);
        const result = {refreshToken, accessToken, memberId};
        return result;
    } catch (err) {
        console.error('로그인 실패: ', err);
        throw err;
    }
    
}

const logOut = async (token) => {
    try {
        await redis.del(token);
    } catch (err) {
        console.error('로그아웃 오류: ', err);
        throw err;
    }
}

module.exports = {generateRefreshToken, generateAccessToken, comparePW, logIn, logOut};