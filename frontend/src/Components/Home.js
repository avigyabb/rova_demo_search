import React, { useState, useEffect, useRef } from 'react';
import FileUploadComponent from './FileUpload';
import '../App.css';
import posthog from '../posthog.js';
import Chat from './Chat.js';
import Sessions from './Sessions.js';

function Home() {
  const [selectedSession, setSelectedSession] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    // Automatically start session recording when the component mounts
    posthog.capture('$pageview');
  }, []);

  const fetchChat = async () => {
    if (chatRef.current) {
      chatRef.current.fetchChat();
    }
  };

  return (
    <div style={{ display: "flex", height: '100vh', width: "100%" }}>
      <div style={{ width: "250px", display: "flex" }}>
        <Sessions selectedSession={selectedSession} setSelectedSession={setSelectedSession} fetchChat={fetchChat} />
      </div>
      <div style={{ maxWidth: "100% - 300px", flexGrow: 1, overflowX: "auto" }}>
        <Chat ref={chatRef} selectedSession={selectedSession} />
      </div>
      <div style={{ width: "300px", display: "flex" }}>
        <FileUploadComponent />
      </div>
    </div>
  );
}

export default Home;
