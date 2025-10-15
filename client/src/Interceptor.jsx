import {useNavigate} from 'react-router-dom';
import {axiosInstance as axios} from './api/axiosInstance';
import {useAuth} from './auth/useAuth';

export default function Interceptor({children}) {
    const navigate = useNavigate();
    const {accessTokenRef, refreshAccessToken, logout, loggingOut} = useAuth();
  
    axios.interceptors.request.use(
        (config) => {
            if (loggingOut) return Promise.reject(new axios.Cancel('로그아웃 중 요청 취소'));
            if (accessTokenRef.current) config.headers.Authorization = `JWT_auth=${accessTokenRef.current}`;
            return config;
        },
        (err) => Promise.reject(err)
    );

    axios.interceptors.response.use(
        (res) => res,
        async (err) => {
            const originalRequest = err.config;
            
            if (loggingOut) {
                return Promise.resolve();
            }

            if (err.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const newToken = await refreshAccessToken();
                    originalRequest.headers.Authorization = `JWT_auth=${newToken}`;
                    return axios(originalRequest); // 인증 재시도
                } catch {
                    logout();
                }
            } else if (err.response?.status === 403 && !originalRequest._retry) {
                originalRequest._retry = true;
                alert('권한이 없습니다.');
            }
            return Promise.reject(err);
        }
    );

return <>{children}</>;
}