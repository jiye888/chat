import {useEffect, useState, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import {axiosInstance as axios} from '../api/axiosInstance';
import {useAuth} from '../auth/useAuth';
import NameModal from '../components/NameModal';
import MessageModal from '../components/MessageModal';

export default function Friend() {
    const [friends, setFriends] = useState([]);
    const [tempNickName, setTempNickName] = useState('');
    const {memberId} = useAuth();
    const navigate = useNavigate();

    const [showNameModal, setShowNameModal] = useState(false);
    
    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await axios.get('/friend/list');
                if (res.data.friendList) {
                    setFriends(res.data.friendList);
                }
            } catch (err) {
                const errorCode = err?.response?.data?.code?.toString();
                const errorMessage = err?.response?.data?.message?.toString();

                if (errorCode) {
                    setErrMessage(`${errorMessage}`);
                    setShowErrorModal(true);
                } else {
                    setErrMessage('친구 목록을 불러오지 못했습니다.');
                    setShowErrorModal(true);
                }
            }
        };

        fetchFriends();
    }, [memberId]);

    // 즐겨찾기 상태 토글하는 함수
    const toggleFavorite = async (friendId) => {
        try {
            // 서버에 즐겨찾기 상태 변경 요청
            // 서버의 변경이 완료되면 새 목록 가져와야
            await axios.patch(`/friend/${friendId}/favorite`, {
                isFavorite: !friends.find(f => f._id === friendId).isFavorite
            });

            const res = await axios.get('/friend/list');
            setFriends(res.data.friendList);
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('즐겨찾기 정보가 변경되지 않았습니다.');
                setShowErrorModal(true);
            }
        }
    };

    const changeNickname = async (friendId) => {
        try {
            if (tempNickName.length > 0) {
                const res = await axios.patch(`/friend/${friendId}/nickname`, {
                    nickname: tempNickName
                });
                if (res.data.success) {
                    setFriends((prev) =>
                        prev.map((f) =>
                            f._id === friendId ? {...f, nickname: tempNickName} : f
                        )
                    );
                }
            } else {
                alert('수정할 이름을 입력해주세요.');
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                console.error(err);
                setErrMessage('별명 수정에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    const handleRequest = () => {
        navigate('/friend/requests');
    };

    const unfriend = async (friendId) => {
        try {
            if (!window.confirm('친구 관계를 해제하겠습니까?')) return;
            const res = await axios.delete(`/friend/${friendId}/unfriend`);
            if (res.data.success) {
                setFriends(prev => prev.filter(f => f._id !== friendId));
            } else {
                setErrMessage('친구 관계 해제에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('친구 관계 해제에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    return (
        <div style={{padding:'30px'}}>
            <div>
                <h2 style={{display: 'flex', justifyContent: 'center', paddingTop: '30px', fontWeight: 'bolder'}}
                >
                    친구 목록</h2>
                <button className='btn btn-warning'
                    style={{display: 'flex', marginLeft: 'auto', marginRight: '30px', color: 'white'}}
                    onClick={handleRequest}>
                    친구 요청 목록
                </button>
            </div>
            <ul style={{paddingTop: '30px'}}>
                {friends.length === 0 ? (
                    <li>아직 등록된 친구가 없습니다.</li>
                ) : (
                    friends.map((f) => (
                        <li key={f._id}>
                            <span>{f.name}</span>
                            {f.nickname && (
                                <span>({f.nickname})</span>
                            )}
                            <span>(친구가 된 날짜: {new Date(f.acceptedAt).toLocaleDateString()})</span>
                            <button style={{borderStyle:'none', backgroundColor:'transparent', fontWeight: '800',
                                fontSize: '17px', color: 'blue'}}
                                onClick={() => toggleFavorite(f._id)}>
                                {f.isFavorite ? '★' : '☆'}
                            </button>
                            <button className='btn btn-warning'
                                style={{background:'#fff2ca', border: '#fff2ca'}}
                                onClick={() => {
                                    f.nickname ? setTempNickName(f.nickname) : setTempNickName(f.name);
                                    setShowNameModal(true);
                                }}>
                                별명
                            </button>
                            <button className='btn btn-warning'
                                style={{background:'#fff2ca', border: '#fff2ca'}}
                                onClick={() => unfriend(f._id)}>
                                친구 해제
                            </button>
                            {showNameModal && (
                                <NameModal
                                    show={showNameModal}
                                    onClose={() => setShowNameModal(false)}
                                    onSave={() => changeNickname(f._id)}
                                    message={'친구 별명 설정'}
                                    //value={f.nickname ? f.nickname : f.name}
                                    value={tempNickName}
                                    onChange={setTempNickName}
                                />
                            )}
                            {showErrorModal && (
                                <MessageModal
                                    message={errMessage}
                                    show={showErrorModal}
                                    onClose={() => setShowErrorModal(false)}
                                />
                            )}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}