import {useState, useRef} from 'react';
import {Container, Row, Col, Form, Button, Card} from 'react-bootstrap';
import {useNavigate} from 'react-router';
import {useAuth} from '../auth/useAuth';
import MessageModal from '../components/MessageModal';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const {login} = useAuth();
    const [idpwError, setIdpwError] = useState(false);
    const idpwErrorRef = useRef(null);
    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) idpwError('이메일과 비밀번호를 모두 입력해주세요.');

        try{
            const res = await login(email, password);
            if (res.success) {
                console.log("로그인에 성공했습니다.");
                const memberId = res.memberId;
                setTimeout(() => {
                    navigate(`/chat/show/${memberId}`);
                }, 0);
            } else {
                setErrMessage('로그인 시 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                if (errorCode === 'AUTH001' || 'MEMBER002') {
                    setIdpwError(`${errorMessage}`);
                } else {
                    setErrMessage(`${errorMessage}`);
                    setShowErrorModal(true);
                }
            } else {
                setErrMessage('로그인 시 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    };

    return (
        <Container className='login-container'>
            <Row>
                <Col>
                    <Card style={{width:'22rem', padding:'1.5rem'}}>
                        <Card.Body>
                            <Card.Title className='text-center mb-4'>로그인</Card.Title>
                            <Form onSubmit={handleLogin}>
                                <Form.Group className='mb-3' controlId='formBasicEmail'>
                                    <Form.Label>이메일 주소</Form.Label>
                                    <Form.Control type="email"
                                        placeholder="이메일을 입력해주세요."
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}    
                                    />
                                </Form.Group>

                                <Form.Group className='mb-3' controlId='formBasicPassword'>
                                    <Form.Label>비밀번호</Form.Label>
                                    <Form.Control type='password'
                                        placeholder='비밀번호를 입력해주세요.'
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <p style={{padding: '8px 3px', color: 'red', fontSize: 'small'}} ref={idpwErrorRef}>
                                    {idpwError}
                                </p>
                                <div>
                                    <Button type='submit' className='w-100 btn-warning'>로그인</Button>
                                    <button type='button'className='register-button'
                                        onClick={() => navigate('/member/register')}>
                                        회원가입
                                    </button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            {showErrorModal && (
                <MessageModal
                    message={errMessage}
                    show={showErrorModal}
                    onClose={() => setShowErrorModal(false)}
                />
            )}
        </Container>
        
    );
};

export default Login;