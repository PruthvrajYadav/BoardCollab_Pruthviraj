import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';

// Completely mock the board and user sidebar so JSDOM never tries to load node-canvas via react-konva!
vi.mock('./components/whiteboard/CanvasBoard', () => ({
    default: () => <div data-testid="mock-canvas">Canvas MOCK</div>
}));
vi.mock('./components/whiteboard/Toolbar', () => ({
    default: () => <div data-testid="mock-toolbar">Toolbar MOCK</div>
}));

describe('App Routing & Auth Home Page', () => {
    it('renders BoardCollab header text correctly', () => {
        render(
            <Provider store={store}>
                <App />
            </Provider>
        );
        expect(screen.getByText(/BoardCollab/i)).toBeInTheDocument();
    });

    it('renders sign in button natively', () => {
        render(
            <Provider store={store}>
                <App />
            </Provider>
        );
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    });
});
