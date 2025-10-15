import {useState, useEffect} from 'react';
import AuthButton from './AuthButton';
import FriendNotification from './FriendNotification';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/useAuth';
import {useSocket} from '../context/SocketContext';

export default function Header({badgeCount}) {
    const {memberId} = useAuth();
    const [showList, setShowList] = useState(false);
    const {socket} = useSocket();
    const navigate = useNavigate();

    return (
        <header className='header'>
            <div className='header-logo'>
                <Link to="/" style={{textDecoration: 'none', color: 'inherit'}}>
                    Connechat
                </Link>
            </div>

            <nav className='header-nav'>
                <Link to='/' className='header-a'>main</Link>
                <Link to='/member/private' className='header-a'>me</Link>
                <Link to={`/chat/show/${memberId}`} className='header-a'>chatroom</Link>
            </nav>

            <div style={{display: 'flex', alignItems: 'center', gap: '11px'}}>
                <FriendNotification badgeCount={badgeCount}/>
                <button className='header-a'
                    onClick={() => navigate('/friend/friend_list')}>
                    친구 목록
                </button>
                <AuthButton />
            </div>
        </header>
    );
}

