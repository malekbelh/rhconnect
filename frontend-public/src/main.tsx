import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { CompanyNotificationsProvider } from './context/CompanyNotificationsContext';
import { ThemeProvider } from './context/ThemeContext';
import { CandidateProfileProvider } from './context/CandidateProfileContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <CandidateProfileProvider>
              <NotificationsProvider>
                <CompanyNotificationsProvider>
                  <App />
                </CompanyNotificationsProvider>
              </NotificationsProvider>
            </CandidateProfileProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

