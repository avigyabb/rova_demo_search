import React, { useState, useEffect } from 'react';
import './App.css';
import posthog from './posthog';
import Home from './Components/Home.js'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  useEffect(() => {
    // Automatically start session recording when the component mounts
    posthog.capture('$pageview');
  }, []);

  const basePath = process.env.REACT_APP_URL_EXT;
  console.log(basePath)

  return (
    <Router>
      <Routes>
        <Route path={basePath} element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
