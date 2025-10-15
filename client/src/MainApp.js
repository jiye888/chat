import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Main from './pages/Main';
import Header from './components/Header';
import Chat from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import Login from './pages/Login';
import Private from './pages/Private';
import Friend from './pages/Friend';
import FriendRequest from './pages/FriendRequest';
import Invite from './pages/Invite';
import MemberSearch from './pages/MemberSearch';
import Register from './pages/Register';
import {useNotification} from './hook/useNotification';

export default function MainApp() {
    const {badgeCount, clearBadge} = useNotification();

    return (
        <>
            <Header badgeCount={badgeCount}/>
            <main>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/friend/friend_list" element={<Friend />}/>
                <Route path="/friend/requests" element={<FriendRequest clearBadge={clearBadge} />} />
                <Route path="/chat/:roomId" element={<Chat />} />
                <Route path="/chat/show/:memberId" element={<ChatRoom />} />
                <Route path="/invite/:roomId" element={<Invite />} />
                <Route path="/member/private" element={<Private />} />
                <Route path="/member/search" element={<MemberSearch />} />
                <Route path="/member/register" element={<Register />} />
            </Routes>
            </main>
        </>
    );
}