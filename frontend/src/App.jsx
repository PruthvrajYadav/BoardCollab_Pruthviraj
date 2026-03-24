import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import Room from './pages/Room';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return isAuthenticated ? children : <Navigate to="/" />;
};

function AppRoutes() {
    return (
        <Router>
            <div className="w-screen h-screen bg-neutral-950 flex flex-col font-sans text-neutral-100 overflow-hidden">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/room/:roomId"
                        element={
                            <ProtectedRoute>
                                <Room />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

function App() {
    return (
        <Provider store={store}>
            <AppRoutes />
        </Provider>
    );
}

export default App;
