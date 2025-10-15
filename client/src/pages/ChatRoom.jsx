import {useEffect, useState} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/useAuth';
import {useSocket} from '../context/SocketContext';
import NameModal from '../components/NameModal';
import MessageModal from '../components/MessageModal';

export default function ChatRoom() {
    const [rooms, setRooms] = useState([]);
    const {memberId, loading} = useAuth();
    const navigate = useNavigate();
    const {socket} = useSocket();
    const [newRoomName, setNewRoomName] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    const fetchChatRooms = async () => {
        if (!loading) {
            try {
                const res = await axios.get(`/chat/show/${memberId}`);
                setRooms(res.data.rooms);
            } catch (err) {
                const errorCode = err?.response?.data?.code?.toString();
                const errorMessage = err?.response?.data?.message?.toString();

                if (errorCode) {
                    setErrMessage(`${errorMessage}`);
                    setShowErrorModal(true);
                    navigate(`/`);
                } else {
                    setErrMessage('채팅방 목록을 불러오지 못했습니다.');
                    setShowErrorModal(true);
                }
            }
        }
    };

    useEffect(() => {
        if (!loading && !memberId) {
            navigate('/');
            return;
        }
        fetchChatRooms();
    }, [memberId, loading]);

    useEffect(() => {
        if (!socket) return;

        socket.on('invite-room', () => {
            fetchChatRooms();
        });

        socket.on('send-preview', ({message, roomId}) => {
            setRooms((prev) => {
                const updated = prev.map(r =>
                    r._id === roomId
                        ? {...r, unread: true, lastMessage: message}
                        : r
                );

                const target = updated.find(r => r._id === roomId);
                const others = updated.filter(r => r._id !== roomId);

                return [target, ...others];
            });
        });

        return () => {
            socket.off('invite-room');
            socket.off('send-preveiw');
        }
    }, []);

    const handleRoomClick = (roomId) => {
        navigate(`/chat/${roomId}`);
    };

    const createChatroom = async () => {
        try {
            const res = await axios.post('/chat/create', {roomName: newRoomName});

            if (res.data.success) {
                const roomId = res.data.roomId;
                navigate(`/chat/${roomId}`);
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('채팅방 생성에 실패했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    return (
        <div className="content-padding">
            <div style={{display: 'flex', alignItems: 'center'}}>
                <h2 style={{paddingLeft: '20px', fontWeight: 'bolder', color: '#668170ed'}}>
                    채팅방 목록
                </h2>
                <button style={{display:'flex', marginLeft:'auto'}} className="btn btn-warning" onClick={() => setShowModal(true)}>채팅방 생성</button>
            </div>
            {rooms.length === 0 ? (<p>아직 참여중인 채팅방이 없습니다.</p>) : (
                <ul
                    style={{borderRadius: '20px', padding: '20px'}}
                >
                    {rooms.map((room) => (
                        <li key={room._id}
                            className='dot-removed'
                        >
                            <button onClick={() => handleRoomClick(room._id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: '#3f8b42',
                                cursor: 'pointer',
                                fontSize: '1.7rem',
                            }}
                            >
                                <span>{room.name}</span>
                                {room.unread && <span className="badge">New</span>}
                            </button>
                            <div
                                style={{fontSize:'smaller', color:'gray', paddingLeft: '3px', paddingTop: '2px'}}
                            >
                                {room.lastMessage ? room.lastMessage : '미리보기가 없습니다.'}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <NameModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSave={createChatroom}
                message={'채팅방 이름'}
                value={newRoomName}
                onChange={setNewRoomName}
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