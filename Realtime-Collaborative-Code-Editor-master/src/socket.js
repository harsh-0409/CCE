import { io } from 'socket.io-client';

export const initSocket = () => {
    return io(process.env.REACT_APP_BACKEND_URL, {
        transports: ['websocket'],
        reconnectionAttempts: Infinity,
        timeout: 10000,
        autoConnect: true,
    });
};