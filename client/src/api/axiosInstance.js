import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: '/',
    withCredentials: true,
});

export function setTokenHeader(token) {
    axiosInstance.defaults.headers.common['Authorization'] = `JWT_auth=${token}`;
}