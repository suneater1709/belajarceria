import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../css/app.css';

const rootElement = document.getElementById('root');

const getBasename = () => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/belajarceria/public')) {
        return '/belajarceria/public';
    }
    return '';
};

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <BrowserRouter basename={getBasename()}>
                <App />
            </BrowserRouter>
        </React.StrictMode>
    );
}
