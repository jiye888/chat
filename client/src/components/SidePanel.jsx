import {useState, useEffect, useRef, useCallback} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import {useAuth} from '../auth/useAuth';
import MessageModal from '../components/MessageModal';

function SidePanel({socket, roomId, isOpen, setIsOpen, admin, setAdmin}) {
    const {memberId} = useAuth();

    const [members, setMembers] = useState([]);
    const [adminId, setAdminId] = useState(admin);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    const [buttonIndex, setButtonIndex] = useState(null);

    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [membersError, setMembersError] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!roomId) return;
        try {
            const res = await axios.get(`/chat/${roomId}/members`);
            if (res.data.success && Array.isArray(res.data.members)) {
                setMembersError(false);
                setMembers(res.data.members);
                setAdminId(res.data.admin);
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            }
            setMembersError(true);
        }
    }, [roomId]);

    useEffect(() => {

        fetchMembers();

    }, [roomId, fetchMembers]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        socket.on('refresh-members', fetchMembers);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            socket.off('refresh-members', fetchMembers);
        };
    }, [socket, setIsOpen, fetchMembers, adminId]);

    useEffect(() => {
        socket.on('invite-notice', () => {
            fetchMembers();
        });
        socket.on('leave-notice', () => {
            fetchMembers();
        });

        return () => {
            socket.off('invite-notice');
            socket.off('leave-notice');
        }
    }, []);

    const handleDelegateAdmin = (receiver) => {
        const res = setAdmin(receiver); // chat.jsx
        if (res) setAdminId(receiver);
    }

    const handleDelegateButton = (index) => {
        setButtonIndex(index);
    }

    return (
        <div>
            <button
                className="btn btn-warning"
                style={{color: 'white'}}
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
            >
                사용자 목록
            </button>
            <div ref={panelRef}
                className='side-panel'
                style={{right: isOpen ? 0 : '-250px'}}
            >
                <div style={{padding: '10px', backgroundColor: 'rgb(255 253 226)'}}>
                    <h3 className='display-center h-color'>채팅방 참여자</h3>
                </div>
                <div style={{padding: '10px'}}>
                    {membersError ? (
                        <p>멤버 목록을 불러오지 못했습니다.</p>
                    ) : (
                        <div>
                            {members.map((mem, index) => (
                                <ul key={mem._id}
                                    style={{
                                    marginTop: '3px',
                                    marginBottom: '3px',
                                    paddingLeft: '10px'
                                }}
                                >
                                    <li key={index}
                                        className='dot-removed'
                                        onClick={() => handleDelegateButton(index)}>
                                    {mem.name}
                                    {adminId === mem._id && <span> 👑</span>}
                                    {adminId === memberId && mem._id !== memberId
                                        && buttonIndex === index && (
                                        <button className='small-btn'
                                            style={{marginLeft: '5px', padding: '3px', color: '#7d6e6e'}}
                                            onClick={() => handleDelegateAdmin(mem._id)}
                                        >
                                            관리자 위임
                                        </button>
                                    )}
                                    </li>
                                </ul>
                            ))}
                        </div>
                    )}
                </div>
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

export default SidePanel;