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

        newSocket.on('user-joined', ({ userId, name }) => {
            dispatch(addUser({ userId, name: name || 'Anonymous' }));
        });

        newSocket.on('room-users', (usersList) => {
            // Filter out existing users or just replace the list for the newcomer
            usersList.forEach(u => {
                dispatch(addUser({ userId: u.userId, name: u.name }));
            });
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
            <header className="h-14 flex items-center justify-between px-3 md:px-6 bg-white border-b border-gray-300 z-20 shadow-sm text-gray-800">
                <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                    <h1 className="text-lg font-bold text-gray-900 hidden sm:block">
                        BoardCollab
                    </h1>
                    <h1 className="text-lg font-bold text-gray-900 sm:hidden">
                        BC
                    </h1>

                    <div className="flex items-center space-x-1 md:space-x-2 bg-gray-100 border border-gray-200 px-1.5 md:px-3 py-1 rounded text-sm text-gray-600 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="font-mono text-[10px] sm:text-xs md:text-sm">{roomId}</span>
                    </div>


                </div>
                <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                    <button
                        onClick={() => setShowUsers(!showUsers)}
                        className={`flex items-center px-2 md:px-3 py-1.5 text-sm font-medium rounded transition-colors ${showUsers ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100 border border-transparent'}`}
                    >
                        <Users className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Participants</span>
                    </button>

                    <div className="w-px h-5 bg-gray-300"></div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-sm font-medium text-red-600 hover:text-red-700"
                    >
                        <LogOut className="w-4 h-4 md:mr-1" />
                        <span className="hidden md:inline">Leave Board</span>
                    </button>

                </div>
            </header>

            <div className="flex-1 flex relative overflow-hidden bg-white">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:top-4 md:left-4 md:bottom-auto md:translate-x-0 z-10 max-w-[95vw] px-2">
                    <Toolbar socket={socket} roomId={roomId} />
                </div>



                <CanvasBoard socket={socket} roomId={roomId} />

                {/* Sidebar for Users */}
                <div className={`absolute top-0 right-0 h-full w-full sm:w-64 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${showUsers ? 'translate-x-0' : 'translate-x-full'}`}>

                    <UserList />
                </div>
            </div>
        </div>
    );
}
