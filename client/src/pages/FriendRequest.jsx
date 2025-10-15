import {useEffect, useState} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import {useAuth} from '../auth/useAuth';
import {useNavigate} from 'react-router-dom';
import {useSocket} from '../context/SocketContext';
import MessageModal from '../components/MessageModal';

export default function FriendRequest({clearBadge}) {
    const {memberId} = useAuth();
    const {socket} = useSocket();
    const [requests, setRequests] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    async function fetchReceivedRequests() {
        try {
            const res = await axios.get('/friend/requests/received');
            if (res.data.success) {
                clearBadge();
                setRequests(res.data.requests);
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('받은 친구 요청 조회에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchSentRequests() {
        try {
            const res = await axios.get('/friend/requests/sent');
            setSent(res.data.requests);
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('보낸 친구 요청 조회에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        } finally {
            setLoading(false);
        }
    }

    //* socket 필요할지 확인
    useEffect(() => {
        socket.on('send-friend-request', () => {
        });
        
        socket.on('friend-request-cancel', ({id}) => {
            setRequests((prev) => prev.filter((req) => req._id !== id));
        });

        return () => {
            socket.off('send-friend-request');
            socket.off('friend-request-cancel');
        }
    }, []);

    useEffect(() => {
        
        fetchReceivedRequests();
        fetchSentRequests();

    }, [memberId]);

    if (loading) return <p>불러오는 중</p>;
    
    async function handleAccept(requestId) {
        try {
            await axios.post(`/friend/${requestId}/accept`);
            setRequests((prev) => prev.filter((req) => req._id !== requestId));
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('친구 요청 수락에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    async function handleReject(requestId) {
        try {
            await axios.post(`/friend/${requestId}/reject`)
            setRequests((prev) => prev.filter((req) => req._id !== requestId));
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('친구 요청 거절에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    async function handleCancel(requestId) {
        try {
            await axios.post(`/friend/${requestId}/cancel`);
            setSent((prev) => prev.filter((req) => req._id !== requestId));
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('친구 요청 취소에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    return (
        <div style={{padding: '30px'}}>
            <h2 style={{display:'flex', justifyContent:'center', paddingTop: '30px', fontWeight: 'bolder'}}>
                친구 요청
            </h2>
            <button className='btn btn-warning'
                style={{display: 'flex', marginLeft: 'auto', marginRight: '30px', color: 'white'}}
                onClick={() => navigate('/member/search')}>
                사용자 검색
            </button>
            
            <div style={{display:'flex', height:'100vh', padding: '50px 100px 50px 100px',}}>
                <section
                    style={{flex:1, borderRight: 'thin solid #f3e573', padding: '0 30px 0 30px'}}>
                    <h3 style={{padding: '20px'}}>받은 요청</h3>
                    {requests.length === 0 ? (
                        <p>현재 친구 요청이 없습니다.</p>
                    ) : (
                        <ul className='request-box'>
                        {requests.map((req) => (
                            <li key={req._id} className="request-item">
                                <div style={{padding: '3px'}}>
                                    {req.sender.name}님이 친구 요청을 보냈습니다.
                                </div>
                                <div style={{padding: '3px', fontSize: '12px'}}>{new Date(req.createdAt).toLocaleDateString()}</div>
                                <button className='request-btn'
                                    onClick={() => handleAccept(req._id)}>
                                    수락
                                </button>
                                <button className='request-btn'
                                    style={{marginLeft: '8px'}}
                                    onClick={() => handleReject(req._id)}>
                                    거절
                                </button>
                            </li>
                        ))}
                        </ul>
                    )}
                </section>

                <section
                    style={{flex:1, padding: '0 30px 0 30px'}}>
                    <h3 style={{padding: '20px'}}>보낸 요청</h3>
                    {sent.length === 0 ? (
                        <p>보낸 요청이 없습니다.</p>
                    ) : (
                        <ul className='request-box'>
                            {sent.map((req) => (
                                <li key={req._id}>
                                    <div style={{padding: '3px'}}>
                                        {req.receiver.name}님에게 요청을 보냈습니다.
                                    </div>
                                    <div style={{padding: '3px', fontSize: '12px'}}>{new Date(req.createdAt).toLocaleDateString()}</div>
                                    <button className='request-btn'
                                        onClick={() => handleCancel(req._id)}>
                                        취소
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
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