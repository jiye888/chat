import {createContext, useContext, useEffect, useRef} from 'react';
import {io} from 'socket.io-client';
import {useNavigate, useLocation} from 'react-router-dom';
import {useAuth} from '../auth/useAuth';

const SocketContext = createContext(null);

export function SocketProvider({children}) {
    const {accessTokenRef, memberId, refreshAccessToken} = useAuth();
    const navigate = useNavigate();
    const currentLocation = useLocation();
    const currentRoom = useRef(null);

    const socketRef = useRef(io('http://localhost:4040', {
        withCredentials: true,
        autoConnect: false})
    );

    useEffect(() => {
        const socket = socketRef.current;
        //if (!socket) return;

        if (memberId && accessTokenRef.current) {
            socket.auth = {token: accessTokenRef.current};
            if (!socket.connected) {
                console.log('socket connect');
                socket.connect();
            }
        } else {
            console.log('socket disconnect');
            socket.auth = null;
            socket.disconnect();
        }

    }, [memberId]);

    useEffect(() => {
        const socket = socketRef.current;

        const path = currentLocation.pathname;

        if (path.startsWith('/chat') && !path.startsWith('/chat/show')) {
            const match = path.match(/\/chat\/(\w+)/);
            const roomId = match ? match[1].toString() : null;

            if (currentRoom.current && currentRoom.current !== roomId) {
                socket.emit('leave-room', {roomId: currentRoom.current});
                currentRoom.current = null;
            }
            
            if (!currentRoom.current) {
                socket.emit('join-room', {roomId});
                currentRoom.current = roomId;
            }
        } else {
            if (currentRoom.current) {
                socket.emit('leave-room', {roomId: currentRoom.current});
                currentRoom.current = null;
            }
        }

    }, [memberId, currentLocation.pathname]);

    useEffect(() => {
        const socket = socketRef.current;

        socket.on('auth-error', async () => {
            try {
                //const accessToken = refreshAccessToken();
                socket.auth = {token: accessTokenRef.current};
            } catch (err) {
                console.error(err);
                socket.disconnect();
                navigate('/auth/login');
            }
        });

        return () => {
            socket.off('auth-error');
        };

    }, []);

    const disconnect = () => { // logout과 연결해주기
        const socket = socketRef.current;
        if (!socket) return;
        socket.disconnect();
    }

    return (
        <SocketContext.Provider value={{socket: socketRef.current, disconnect}}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}