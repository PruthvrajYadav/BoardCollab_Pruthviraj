import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const initSocket = (token) => {
    return io(URL, {
        auth: { token },
        transports: ['websocket'],
    });
};
