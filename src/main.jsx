import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global Toaster configuration */}
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          borderRadius: '16px',
          background: '#1e2432',
          color: '#fff',
          fontWeight: 'bold',
        },
        success: {
          style: {
            background: '#3aa676',
            boxShadow: '0 4px 15px rgba(66, 202, 141, 0.49)', // Green shadow for success toasts
          },
        },
        error: {
          style: {
            background: '#ef4444',
            boxShadow: '0 4px 15px rgba(241, 49, 49, 0.47)', // Red shadow for error toasts
          },
        },
      }}
    />

    <App />
  </React.StrictMode>
);