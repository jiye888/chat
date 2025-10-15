import {useState, useEffect} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import {useSocket} from '../context/SocketContext';
import {useAuth} from '../auth/useAuth';

export function useNotification() {
    const [badgeCount, setBadgeCount] = useState(0);
    const {socket} = useSocket();
    const {memberId} = useAuth();
    //const auth = useAuth();
    //const memberId = auth?.memberId;

    useEffect(() => {
        if (!memberId) {
            setBadgeCount(0);
            return;
        }

        async function fetchCount() {
            const res = await axios.get('/friend/request/count');
            setBadgeCount(res.data.unread);
        }

        fetchCount();
    }, [memberId]);

    useEffect(() => {

        socket.on('friend-request-alarm', ({unread}) => {
            setBadgeCount(unread);
        });

        socket.on('friend-request-cancel', () => {
            setBadgeCount(prev => prev - 1);
        });

        socket.on('send-friend-request', () => {
            setBadgeCount(prev => prev + 1);
        });

        return () => {
            socket.off('friend-request-alarm');
            socket.off('friend-request-cancel');
            socket.off('send-friend-request');
        };

    }, []);

    const clearBadge = () => setBadgeCount(0);

    return {badgeCount, clearBadge};
}