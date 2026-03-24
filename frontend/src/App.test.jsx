import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';

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
