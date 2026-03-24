import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, logout } from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Home() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
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
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? (
                                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </div>
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

                            <div className="pt-4 mt-6 border-t border-gray-200">
                                <button
                                    onClick={() => dispatch(logout())}
                                    className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
