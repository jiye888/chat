const bcrypt = require('bcrypt');
const Member = require('../model/Member');
const authService = require('./authService');
const CustomError = require('../error/CustomError');

const registerSystemMember = async () => {
    try {
        const email = 'system@connechat.com';
        let systemMember = await Member.findOne({email});
        if (!systemMember) {
            systemMember = await Member.create({
                name: 'SYSTEM',
                email,
                password: await bcrypt.hash('SYSTEM_PASSWORD', 10),
            });
        }
        return systemMember;
    } catch (err) {
        console.error('시스템 유저 등록 오류: ', err);
        throw err;
    }
}

const registerMember = async(email, name, password) => {
    try {
        const existMember = await Member.findOne({email});
        if (existMember) {
            throw new CustomError('EMAIL_DUPLICATE');
        }

        const hashedPW = await bcrypt.hash(password, 10);
        const newMember = new Member({email, name, password: hashedPW});
        await newMember.save();

        return {success: true, message: '회원가입이 완료되었습니다.'};
    } catch (err) {
        console.error('회원 가입 오류: ', err);
        throw err;
    }
};

const updateName = async (memberId, newName) => {
    try {
        const existMember = await Member.findOne({_id: memberId});
        if (!existMember) throw new CustomError('USER_NOT_FOUND');
        const updatedMember = await Member.findByIdAndUpdate(
            {_id: memberId},
            {name: newName},
        );
        return {success: true, message: '회원 이름 수정을 완료했습니다.', name: newName};
    } catch (err) {
        console.error('회원 이름 변경 오류: ', err);
        throw err;
    }
};

const updatePassword = async (memberId, currentPassword, newPassword) => {
    try {
        const existMember = await Member.findOne({_id: memberId});
        if (!existMember) throw new CustomError('USER_NOT_FOUND');
        const isPassword = await authService.comparePW(currentPassword, existMember.password);
        if (!isPassword) throw new CustomError('INVALID_CREDENTIALS');

        const hashedNew = await bcrypt.hash(newPassword, 10);
        const updatedMember = await Member.findByIdAndUpdate(
            {_id: memberId},
            {password: hashedNew},
        );
        return {success: true, message: '회원 비밀번호 수정을 완료했습니다.'};
    } catch (err) {
        console.error('패스워드 변경 오류: ', err);
        throw err;
    }
};

const getMember = async(memberId) => {
    try {
        const existMember = await Member.findOne({_id: memberId});

        if (!existMember) throw new CustomError('USER_NOT_FOUND');
        return {success: true, message: '회원 정보 조회에 성공했습니다.', memberId, name: existMember.name, email: existMember.email};
    } catch (err) {
        console.error('회원 정보 조회 오류: ', err);
        throw err;
    }
};

const getMemberByEmail = async(email) => {
    try {
        const existMember = await Member.findOne({email});
        if (!existMember) throw new CustomError('USER_NOT_FOUND');

        return existMember;
    } catch (err) {
        console.error('회원 정보 조회(메일) 오류: ', err);
        throw err;
    }
}

const deleteMember = async(memberId, password) => {
    try {
        const existMember = await Member.findOne({_id: memberId});
        if (!existMember) throw new CustomError('USER_NOT_FOUND');
        const isPassword = authService.comparePW(password, existMember.password);

        if (!isPassword) throw new CustomError('INVALID_CREDENTIALS');

        const del = await Member.deleteOne({_id: memberId});
        return {success: true, message: '회원 탈퇴에 성공했습니다.'};
    } catch (err) {
        console.error('회원 탈퇴 오류: ', err);
        throw err;
    }
};

module.exports = {
    registerSystemMember, registerMember, getMember, getMemberByEmail, deleteMember,
    updateName, updatePassword,
};