import {useNavigate} from 'react-router-dom';
import {useSocket} from '../context/SocketContext';
import {useAuth} from '../auth/useAuth';

export default function AuthButton() {
    const {memberId, logout} = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    function handleLogout() {
        socket.disconnect();
        logout();
    }

    return (
        <>
          <div>
            {memberId && <button className='header-a' onClick={() => navigate('/member/private')}>내 정보</button>}
          </div>
          <div className='auth-button'>
            {memberId ? (
              <button className='header-a' onClick={handleLogout}>로그아웃</button>
            ) : (
              <button className='header-a' onClick={() => navigate('/auth/login')}>로그인</button>
            )}
          </div>
        </>
    );
}
