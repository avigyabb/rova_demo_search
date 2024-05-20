import React, { useState, useEffect } from 'react';
import FileUploadComponent from './FileUpload';
import '../App.css';
import posthog from '../posthog.js';
import Chat from './Chat.js';

function Home() {
  useEffect(() => {
    // Automatically start session recording when the component mounts
    posthog.capture('$pageview');
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <FileUploadComponent />
      <div style={{ flex: 1 }}>
        {/* Your main content goes here */}
        <Chat/>
      </div>
    </div>
  );
}

export default Home;