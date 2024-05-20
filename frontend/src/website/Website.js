import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { createTheme, ThemeProvider } from '@mui/material';
import Hero from './Website/Hero';
import Login from './Website/Login';
import MiniProjects from "./Website/MiniProjects";

const customTheme = createTheme({
  typography: {
    fontFamily: 'PoppinsFont, sans-serif'
  },
});

const AppContent = () => {

  return (
    <ThemeProvider theme={customTheme}>
      <div style={{ height: '100vh' }}>
        <Hero />
      </div>
    </ThemeProvider>
  );
};

function Website() {
  return (
    <AppContent />
  );
}

export default Website;