import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ToastProvider } from './components/Toast/ToastProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './components/Notification';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider position="top-right">
          <ToastProvider>
            <App />
          </ToastProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

