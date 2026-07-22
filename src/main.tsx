import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ToastProvider } from './components/Toast/ToastProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { VaultProvider } from './contexts/VaultContext';
import { VaultGate } from './components/Vault';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <VaultProvider>
          <VaultGate>
            <ToastProvider>
              <App />
            </ToastProvider>
          </VaultGate>
        </VaultProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

