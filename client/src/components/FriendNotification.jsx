import {useState, useEffect} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import {useSocket} from '../context/SocketContext';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../auth/useAuth';

export default function FriendNotification({badgeCount}) {
    const navigate = useNavigate();
    const {socket} = useSocket();
    const {memberId} = useAuth();

    if (!memberId) return null;

    return (
        <div style={{marginLeft: '12px'}}>
            <button className="notification-btn header-a"
                style={{padding: '0px'}}
                onClick={() => navigate('/friend/requests')}>
                친구 요청
            </button>
            {badgeCount > 0 && (
                <span style={{position: 'static'}}
                    className='red-badge'>
                    {badgeCount > 10 ? '🔔10+' : '🔔'+badgeCount}
                </span>
            )}
        </div>
    );
}