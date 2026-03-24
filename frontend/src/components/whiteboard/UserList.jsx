import React from 'react';
import { useSelector } from 'react-redux';
import { User } from 'lucide-react';

export default function UserList() {
    const { users } = useSelector((state) => state.room);
    const { user: currentUser } = useSelector((state) => state.auth);

    // Filter out local user from state to avoid duplicate rendering
    const remoteUsers = users.filter((u) => u.name !== currentUser?.name);

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                    <UsersIcon className="w-5 h-5 text-gray-500" />
                    <span>Participants ({remoteUsers.length + 1})</span>
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Local User (You) */}
                <div className="flex items-center space-x-3 p-2 rounded-md bg-blue-50/50 border border-blue-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shadow-sm border border-blue-200">
                        {currentUser?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'Anonymous'} <span className="text-gray-500 font-normal">(You)</span></p>
                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                            Online
                        </p>
                    </div>
                </div>

                {remoteUsers.length === 0 && (
                    <div className="text-gray-500 text-sm text-center mt-4 border border-dashed border-gray-300 rounded p-4">
                        No other users here yet.
                    </div>
                )}

                {/* Remote Users */}
                {remoteUsers.map((u, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold shadow-sm border border-gray-200">
                            {u.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                Online
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UsersIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    );
}
