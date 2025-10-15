import {createContext, useState, useEffect, useRef} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {axiosInstance as axios, setTokenHeader} from '../api/axiosInstance';
import originalAxios from 'axios'; //access token 재발급시 인터셉터 401 루프 생기는 것 방지
import MessageModal from '../components/MessageModal';

export const AuthContext = createContext();

export function AuthProvider({children}) {
    const accessTokenRef = useRef(null);
    const [memberId, setMemberId] = useState(null);
    const [loading, setLoading] = useState(true); //token 로딩
    const loggingOutRef = useRef(false);
    const retryRef = useRef(false);

    const [showTokenModal, setShowTokenModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        //앱 시작 시 서버에 로그인 확인 요청
        if (['/auth/login', '/member/register'].includes(location.pathname)) return;

        if (!accessTokenRef.current) {
            if (['/'].includes(location.pathname)) {
                refreshWithoutErrorAlarm();
            } else {
                refreshAccessToken();
            }
        } else {
            setLoading(false);
        } 
        
    }, [location.pathname]);

    const login = async (email, password) => {
        try {
            const res = await originalAxios.post('/auth/login',
                {email:email, password:password},
            );
            accessTokenRef.current = res.data.accessToken;
            setMemberId(res.data.memberId);
            setTokenHeader(res.data.accessToken);
            return res.data;
        } catch (err) {
            setMemberId(null);
            accessTokenRef.current = null;
            setTokenHeader(null);
           throw err;
        }
    }

    const logout = async () => {
        try {
            if (loggingOutRef.current) return;
            loggingOutRef.current = true;
            const res = await axios.post('/auth/logout');
            setMemberId(null);
            accessTokenRef.current = null;
            setTokenHeader(null);
            navigate('/');
        } catch (err) {
            setErrorMessage('로그아웃 중 오류가 발생했습니다');
            setShowErrorModal(true);
        } finally {
            setTimeout(() => {
                loggingOutRef.current = false;
            }, 1000);
        }
    };

    const refreshAccessToken = async () => {
        try {
            console.log('refresh access token');
            const res = await originalAxios.post('/auth/refresh',
                {withCredentials: true}
            );
            
            if (res.data.success && !retryRef.current) {
                accessTokenRef.current = res.data.accessToken;
                setTokenHeader(res.data.accessToken);
                setMemberId(res.data.memberId);
            } else if (!retryRef.current) {
                retryRef.current = true;
                refreshAccessToken();
            } else {
                logout();
            }
            return res.data.accessToken;
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                switch (errorCode) {
                    case 'AUTH003':
                        setShowTokenModal(true);
                        break;
                    case 'AUTH004':
                        setShowTokenModal(true);
                        navigate('/auth/login');
                        break;
                
                    default:
                        setErrorMessage(`${errorMessage}`);
                        setShowErrorModal(true);
                        break;
                }
            } else {
                setErrorMessage('서버 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        } finally {
            setLoading(false);
            retryRef.current = false;
        }
    }
    
    const refreshWithoutErrorAlarm = async () => {
        try {
            const res = await originalAxios.post('/auth/refresh',
                {withCredentials: true}
            );
            accessTokenRef.current = res.data.accessToken;
            setTokenHeader(res.data.accessToken);
            setMemberId(res.data.memberId);
        } catch (err) {}
    }

    const clearAccessToken = async () => {
        setMemberId(null);
        accessTokenRef.current = null;
        setTokenHeader(null);
    }

    return (
        <AuthContext.Provider value={{memberId, setMemberId, loading, logout, login,
            refreshAccessToken, accessTokenRef, clearAccessToken, loggingOut: loggingOutRef.current}}>
            {children}

            {showTokenModal && (
                <MessageModal
                    message={'세션이 만료되었습니다. 로그인이 필요합니다.'}
                    show={showTokenModal}
                    onClose={() => setShowTokenModal(false)}
                />
            )}

            {showErrorModal && (
                <MessageModal
                    message={errorMessage}
                    show={showErrorModal}
                    onClose={() => setShowErrorModal(false)}
                />
            )}
            
        </AuthContext.Provider>
    );
}