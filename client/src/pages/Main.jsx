import {useAuth} from '../auth/useAuth';
import {useNavigate} from 'react-router';

export default function Home() {
    const {accessTokenRef, memberId} = useAuth();
    const navigate = useNavigate();

    const handleNavigate = () => {
        if (accessTokenRef.current && memberId) {
            navigate(`/chat/show/${memberId}`);
        } else {
            navigate('/auth/login');
        }
    }

    return (
        <div>
            <h2 className='main' style={{paddingTop: '30px'}}>Main Page</h2>
            <h5 className='main'>환영합니다!</h5>
            <div style={{display: 'flex', justifyContent: 'center', paddingTop: '100px'}}>
                <button className='main-chat' onClick={handleNavigate}>
                    채팅방 입장
                </button>
            </div>
        </div>
    );

}
