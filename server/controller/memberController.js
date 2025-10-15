const memberService = require('../service/memberService');
const CustomError = require('../error/CustomError');

const registerMember = async (req, res, next) => {
    try {
        const {email, name, password} = req.body;
        if (!email || !name || !password) return next(new CustomError('INVALID_INPUT', '모든 정보를 입력해주세요.'));
        if (password.length < 6) return next(new CustomError('INVALID_INPUT', '비밀번호를 6자리 이상 입력해주세요.'));
        const result = await memberService.registerMember(email, name, password);
        if (result.success) return res.status(201).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('회원 가입 오류: ', err);
        next(err);
    }
};

const getMember = async (req, res, next) => {
    try {
        const memberId = req.member.id;
        const result = await memberService.getMember(memberId);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('회원 정보 조회 오류: ', err);
        next(err);
    }
};

const updateName = async (req, res, next) => {
    try {
        const memberId = req.member.id;
        const newName = req.body.name;
        const result = await memberService.updateName(memberId, newName);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('회원 이름 수정 오류: ', err);
        next(err);
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const memberId = req.member.id;
        const {currentPassword, newPassword} = req.body;
        const result = await memberService.updatePassword(memberId, currentPassword, newPassword);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('회원 비밀번호 수정 오류: ', err);
        next(err);
    }
};

const deleteMember = async (req, res, next) => {
    try {
        const memberId = req.member.id;
        const {password} = req.body;
        const result = await memberService.deleteMember(memberId, password);
        if (result.success) return res.status(200).json(result);
        return next(new CustomError('INTERNAL_SERVER_ERROR'));
    } catch (err) {
        console.error('회원 탈퇴 오류: ', err);
        next(err);
    }
};

module.exports = {registerMember, getMember, updateName, updatePassword, deleteMember};