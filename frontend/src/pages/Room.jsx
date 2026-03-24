import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { initSocket } from '../services/socket';
import { setRoom, addUser } from '../store/roomSlice';
import Toolbar from '../components/whiteboard/Toolbar';
import CanvasBoard from '../components/whiteboard/CanvasBoard';
import UserList from '../components/whiteboard/UserList';
import { LogOut, Users } from 'lucide-react';

export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token, user } = useSelector((state) => state.auth);
    const [socket, setSocket] = useState(null);
    const [showUsers, setShowUsers] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const newSocket = initSocket(token);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join-room', roomId);
            dispatch(setRoom({ roomId }));
            if (user) dispatch(addUser({ userId: newSocket.id, name: user.name }));
        });

        newSocket.on('user-joined', ({ userId, user: joinedUser }) => {
            dispatch(addUser({ userId, name: joinedUser?.name || 'Anonymous' }));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [roomId, token, navigate, dispatch, user]);

    if (!socket) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-700">
            <p className="text-gray-500 font-medium">Connecting to Room...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-200">
            <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-300 z-20 shadow-sm text-gray-800">
                <div className="flex items-center space-x-4">
                    <h1 className="text-lg font-bold text-gray-900">
                        BoardCollab
                    </h1>
                    <div className="flex items-center space-x-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded text-sm text-gray-600">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="font-mono">{roomId}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowUsers(!showUsers)}
                        className={`flex items-center px-3 py-1.5 text-sm font-medium rounded transition-colors ${showUsers ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100 border border-transparent'}`}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Participants
                    </button>
                    <div className="w-px h-5 bg-gray-300"></div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        <LogOut className="w-4 h-4 mr-1" />
                        Leave Board
                    </button>
                </div>
            </header>

            <div className="flex-1 flex relative overflow-hidden bg-white">
                <div className="absolute top-4 left-4 z-10">
                    <Toolbar socket={socket} roomId={roomId} />
                </div>

                <CanvasBoard socket={socket} roomId={roomId} />

                {/* Sidebar for Users */}
                <div className={`absolute top-0 right-0 h-full w-64 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-20 ${showUsers ? 'translate-x-0' : 'translate-x-full'}`}>
                    <UserList />
                </div>
            </div>
        </div>
    );
}
