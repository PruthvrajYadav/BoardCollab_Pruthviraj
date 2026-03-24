import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, logout } from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Home() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [joinRoomId, setJoinRoomId] = useState('');
    const [error, setError] = useState('');

    const { isAuthenticated, user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/auth/login' : '/auth/register';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                if (!isLogin) {
                    setIsLogin(true);
                    setFormData({ ...formData, password: '' });
                } else {
                    dispatch(loginSuccess({ user: { id: data._id, name: data.name, email: data.email }, token: data.token }));
                }
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    const createRoom = async () => {
        try {
            const res = await fetch(`${API_URL}/rooms/create`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                navigate(`/room/${data.roomId}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const joinRoom = async (e) => {
        e.preventDefault();
        const cleanId = joinRoomId.trim();
        if (!cleanId) return;
        try {
            const res = await fetch(`${API_URL}/rooms/join/${cleanId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                navigate(`/room/${joinRoomId}`);
            } else {
                setError('Room not found or error joining');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    BoardCollab
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Real-time visual collaboration for teams.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!isAuthenticated ? (
                        <>
                            <div className="flex justify-center space-x-4 mb-6 border-b border-gray-200 pb-4">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className={`pb-2 px-1 font-medium text-sm border-b-2 transition-colors ${!isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Register
                                </button>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                {!isLogin && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <div className="mt-1">
                                        <input
                                            type="email"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <div className="mt-1">
                                        <input
                                            type="password"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-center text-sm text-gray-700">
                                Signed in as <span className="font-semibold">{user?.name}</span>
                            </div>

                            <button
                                onClick={createRoom}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Create New Room
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or join an existing room</span>
                                </div>
                            </div>

                            <form onSubmit={joinRoom} className="mt-4 flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Enter Room ID"
                                    className="flex-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Join
                                </button>
                            </form>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
