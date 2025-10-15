import {useState, useEffect} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import MessageModal from '../components/MessageModal';
import {useSocket} from '../context/SocketContext';
import {useParams, useNavigate} from 'react-router-dom';

export default function Invite() {
    const [friends, setFriends] = useState([]);
    const [members, setMembers] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [modalMessage, setModalMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    
    const {socket} = useSocket();
    const {roomId} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const getFriends = async () => {
            try {
                const res = await axios.get('/friend/list');
                setFriends(res.data.friendList);
            } catch (err) {
                const errorCode = err?.response?.data?.code?.toString();
                const errorMessage = err?.response?.data?.message?.toString();

                if (errorCode) {
                    setErrMessage(`${errorMessage}`);
                    setShowErrorModal(true);
                } else {
                    setErrMessage('친구 목록을 불러오는 데에 실패했습니다.');
                    setShowErrorModal(true);
                }
            }
        }

        const getMembers = async () => {
            try {
                const res = await axios.get(`/chat/${roomId}/members`);
                setMembers(res.data.members.map(m => m._id));
            } catch (err) {
                const errorCode = err?.response?.data?.code?.toString();
                const errorMessage = err?.response?.data?.message?.toString();

                if (errorCode) {
                    setErrMessage(`${errorMessage}`);
                    setShowErrorModal(true);
                } else {
                    setErrMessage('참여자 목록을 불러오는 데에 실패했습니다.');
                    setShowErrorModal(true);
                }
            }
        }

        getFriends();
        getMembers();

    }, []);
    
    const inviteFriends = async () => {
        try {
        if (selectedFriends.length === 0) {
            setModalMessage('초대할 친구를 선택하세요.');
            setShowModal(true);
            return;
        }

        const res = await axios.post(`/chat/${roomId}/invite`,
            {inviteList: selectedFriends});

        if (res.data.success) {
            alert('친구 초대가 완료되었습니다.');
        }

        navigate(`/chat/${roomId}`);
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('친구 초대에 실패했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    const handleCheckboxChange = (friendId, checked) => {
        if (checked) {
            setSelectedFriends(prev => [...prev, friendId]);
        } else {
            setSelectedFriends(prev => prev.filter(id => id !== friendId));
        }
    }

    return (
        <div style={{padding:'50px 100px'}}>
            <h3 style={{fontWeight: '500', display: 'flex', justifyContent: 'center'}}>친구 목록</h3>
            {friends.length === 0 && <p style={{padding: '20px 120px 0px 0px'}}>등록된 친구가 없습니다.</p>}
            <ul style={{padding: '20px 30px'}} className='dot-removed'>
                {friends.map(friend => (
                    <li key={friend._id}>
                        <label style={{display: 'flex', alignItems: 'center'}}>
                            <input type="checkbox"
                                value={friend._id}
                                disabled={members.includes(friend._id)}
                                onChange={(e) => handleCheckboxChange(friend._id, e.target.checked)}
                                style={{margin: '2px 5px'}}
                            />
                            {friend.name}
                        </label>
                    </li>
                ))}
            </ul>
            <button className='btn btn-warning'
                style={{color:'white', padding: '5px', marginLeft: '30px'}}
                onClick={() => inviteFriends(selectedFriends)}>
                친구 초대
            </button>
            <button className='btn btn-warning'
                style={{color:'white', padding: '5px', marginLeft: '10px'}}
                onClick={() => navigate(`/chat/${roomId}`)}
            >
                취소
            </button>

            <MessageModal
                message={modalMessage}
                show={showModal}
                onClose={() => setShowModal(false)}
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