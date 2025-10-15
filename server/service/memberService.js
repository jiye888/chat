const bcrypt = require('bcrypt');
const Member = require('../model/Member');
const authService = require('./authService');
const CustomError = require('../error/CustomError');

const registerSystemMember = async () => {
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
}

const registerMember = async(email, name, password) => {
    const existMember = await Member.findOne({email});
    if (existMember) {
        throw new CustomError('EMAIL_DUPLICATE');
    }

    const hashedPW = await bcrypt.hash(password, 10);
    const newMember = new Member({email, name, password: hashedPW});
    await newMember.save();

    return {success: true, message: '회원가입이 완료되었습니다.'};
};

const updateName = async (memberId, newName) => {
    const existMember = await Member.findOne({_id: memberId});
    if (existMember) {
        const updatedMember = await Member.findByIdAndUpdate(
            {_id: memberId},
            {name: newName},
        );
        return {success: true, message: '회원 이름 수정을 완료했습니다.', name: newName};
    } else {
        throw new CustomError('USER_NOT_FOUND');
    }
};

const updatePassword = async (memberId, currentPassword, newPassword) => {
    const existMember = await Member.findOne({_id: memberId});
    const isPassword = await authService.comparePW(currentPassword, existMember.password);

    if (existMember) {
        if (isPassword) {
            const hashedNew = await bcrypt.hash(newPassword, 10);
            const updatedMember = await Member.findByIdAndUpdate(
                {_id: memberId},
                {password: hashedNew},
            );
            return {success: true, message: '회원 비밀번호 수정을 완료했습니다.'};
        } else {
            throw new CustomError('INVALID_CREDENTIALS');
        }
    } else {
        throw new CustomError('USER_NOT_FOUND');
    }
};

const getMember = async(memberId) => {
    const existMember = await Member.findOne({_id: memberId});

    if (existMember) {
        return {success: true, message: '회원 정보 조회에 성공했습니다.', memberId, name: existMember.name, email: existMember.email};
    } else {
        throw new CustomError('USER_NOT_FOUND');
    }
};

const getMemberByEmail = async(email) => {
    const existMember = await Member.findOne({email});

    if (existMember) {
        return existMember;
    } else {
        throw new CustomError('USER_NOT_FOUND');
    }
}

const deleteMember = async(memberId, password) => {
    const existMember = await Member.findOne({_id: memberId});
    const isPassword = authService.comparePW(password, existMember.password);

    if (existMember) {
        if (isPassword) {
            const del = await Member.deleteOne({_id: memberId});
            return {success: true, message: '회원 탈퇴에 성공했습니다.'};
        } else {
            throw new CustomError('INVALID_CREDENTIALS');
        }
    } else {
        throw new CustomError('USER_NOT_FOUND');
    }
};

module.exports = {
    registerSystemMember, registerMember, getMember, getMemberByEmail, deleteMember,
    updateName, updatePassword,
};