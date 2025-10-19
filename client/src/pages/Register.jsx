import {useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router';
import MessageModal from '../components/MessageModal';

export default function Register() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== passwordCheck) setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');

        setMessage(null);
        setError(null);

        try {
            const res = await axios.post('/member/register', {
                email,
                name,
                password,
            },
            {
                credentials: 'same-origin'
            });
            setMessage(res.data.message);
            setEmail('');
            setName('');
            setPassword('');
            setPasswordCheck('');
            navigate('/');
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('회원 가입에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    };

    return (
        <div className='form-div'>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto border rounded shadow form-container">
                <h2 className="text-xl font-bold mb-4" style={{fontFamily:'ui-rounded'}}>회원 가입</h2>

                <div className="mb-2 label-input">
                    <label className="label" htmlFor="email">이메일</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border input-250"
                    />
                </div>

                <div className="mb-2 label-input">
                    <label className="label" htmlFor="name">이름</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="border input-250"
                    />
                </div>

                <div className="mb-2 label-input">
                    <label className="label" htmlFor="pw">비밀번호</label>
                    <input
                        id="pw"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border input-250"
                    />
                </div>
                
                <div className="mb-2 label-input">
                    <label className="label" htmlFor="pwCheck">비밀번호 확인</label>
                    <input
                        id="pwCheck"
                        type="password"
                        value={passwordCheck}
                        onChange={(e) => setPasswordCheck(e.target.value)}
                        required
                        className="border input-250"
                    />
                </div>

                <div className='display-center'>
                    <button
                        type="submit"
                        className="mt-3 p-2 rounded btn btn-warning width-70"
                    >
                        가입하기
                    </button>
                </div>

                {message && <p className="mt-2 text-green-600">{message}</p>}
                {error && <p className="mt-2 text-red-600">{error}</p>}
            </form>
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