import {useEffect, useState} from 'react';
import {useAuth} from '../auth/useAuth';
import {useNavigate} from 'react-router-dom';
import NameModal from '../components/NameModal';
import PasswordModal from '../components/PasswordModal';
import PasswordCheckModal from '../components/PasswordCheckModal';
import {axiosInstance as axios} from '../api/axiosInstance';
import MessageModal from '../components/MessageModal';

export default function Private() {
    const {memberId, clearAccessToken} = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [tempName, setTempName] = useState(name);
    const [showNameModal, setShowNameModal] = useState(false);

    const [showPwModal, setShowPwModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [showCheckModal, setShowCheckModal] = useState(false);
    const [checkPassword, setCheckPassword] = useState('');
    
    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleSaveName = async () => {
        setName(tempName);
        setShowNameModal(false);
        try {
            const res = await axios.patch('/member/update/name',
                {name: tempName},
            );
        
            if (res.data.success) {
                alert('이름 변경 완료');
                setShowNameModal(false);
                setName(res.data.name);
            } else {
                alert('이름 변경 실패');
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('회원 정보 변경에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    };

    const handleSavePassword = async () => {
        try {
            if (currentPassword.length === 0 || newPassword.length < 6) {
                alert('비밀번호는 6자리 이상으로 작성해주세요.');
                return;
            }

            const res = await axios.patch('/member/update/password', {
                currentPassword,
                newPassword,
            });

            if (res.data.success) {
                alert('비밀번호 변경 완료');
                setShowPwModal(false);
                setCurrentPassword('');
                setNewPassword('');
            } else {
                alert('비밀번호 변경 실패');
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('회원 정보 변경에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    };

    const handleWithdraw = async () => {
        const confirm = window.confirm('회원 탈퇴를 진행하시겠습니까?');
        if (!confirm) return;
        try {
            const res = await axios.post('/member/delete',
                {password: checkPassword}
            );
            if (res.data.success) {
                setCheckPassword('');
                await clearAccessToken();
                navigate('/');
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('회원 탈퇴에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    };

    useEffect(() => {
        const getMember = async () => {
            try {
                const res = await axios.get('/member/private');
                if (res.data.success) {
                    setName(res.data.name);
                    setEmail(res.data.email);
                } else {
                    console.log(res.data.message);
                }   
            } catch (err) {
                const errorCode = err?.response?.data?.code?.toString();
                const errorMessage = err?.response?.data?.message?.toString();

                if (errorCode) {
                    setErrMessage(`${errorMessage}`);
                    setShowErrorModal(true);
                } else {
                    setErrMessage('회원 정보 조회에 오류가 발생했습니다.');
                    setShowErrorModal(true);
                }
            }
        };

        getMember();
    }, []);

    useEffect(() => {
        if (!memberId) {
            navigate('/auth/login'); //로그인x시 리디렉션
        }
        
    }, [memberId, navigate]);

    return (
        <div style={{display:'flex', alignItems:'center', flexDirection:'column', padding: '50px'}}>
            <h1 style={{padding: '30px 0px 20px', fontWeight: '900'}}>{name}님의 페이지</h1>
            <div style={{padding: '30px'}}>
                <p>이름: {name}</p>
                <p>이메일: {email}</p>
            </div>
            <div style={{flexDirection:'row', padding: '5px 0px 20px'}}>
                <button className="btn btn-outline-primary" onClick={() => setShowNameModal(true)}>이름 변경</button>
                <button className="btn btn-outline-primary"
                    style={{marginLeft:'10px'}}
                    onClick={() => setShowPwModal(true)}>
                    비밀번호 변경
                </button>
            </div>
            <div>
                <button style={{background: 'transparent', color: 'gray', border: 'none', fontSize: '15px',
                    borderBottomStyle: 'solid', borderBottomWidth: 'thin'}}
                    onClick={() => setShowCheckModal(true)}>
                    회원 탈퇴
                </button>
            </div>

            <NameModal
                show={showNameModal}
                onClose={() => setShowNameModal(false)}
                onSave={handleSaveName}
                message={'이름 변경'}
                value={tempName}
                onChange={setTempName}
            />
            <PasswordModal
                show={showPwModal}
                onClose={() => setShowPwModal(false)}
                onSave={handleSavePassword}
                currentPassword={currentPassword}
                newPassword={newPassword}
                setCurrentPassword={setCurrentPassword}
                setNewPassword={setNewPassword}
            />
            <PasswordCheckModal
                show={showCheckModal}
                onClose={() => setShowCheckModal(false)}
                onSave={handleWithdraw}
                value={checkPassword}
                onChange={setCheckPassword}
            />
            {showErrorModal && (
                <MessageModal
                    message={errMessage}
                    show={showErrorModal}
                    onClose={() => setShowErrorModal(false)}
                />
            )}
        </div>
    );
}