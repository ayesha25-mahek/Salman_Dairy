import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DbProvider } from './context/DbContext';
import { LandingPage } from './pages/LandingPage';
import { DashboardWrapper } from './components/Dashboard/DashboardWrapper';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <DbProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Owner Authenticated Dashboard */}
            <Route path="/dashboard" element={<DashboardWrapper />} />
            
            {/* Fallback redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DbProvider>
    </ThemeProvider>
  );
}

export default App;
