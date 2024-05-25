import React, { useState, useEffect, useRef } from 'react';
import FileUploadComponent from './FileUpload';
import '../App.css';
import posthog from '../posthog.js';
import Chat from './Chat.js';
import Sessions from './Sessions.js';

function Home() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedFileIds, setSelectedFileIds] = useState(localStorage.getItem('selectedFileIds') ? JSON.parse(localStorage.getItem('selectedFileIds')) : []);
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

  useEffect(() => {
    // Save to localStorage when selectedFileIds changes
    localStorage.setItem('selectedFileIds', JSON.stringify(selectedFileIds));
  }, [selectedFileIds]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: '100vh', width: "100%" }}>
      <div style={{ width: "100%" }}>
        <Sessions selectedSession={selectedSession} setSelectedSession={setSelectedSession} fetchChat={fetchChat} />
      </div>
      <div style={{ display: "flex", flexGrow: 1 }}>
        <div style={{ width: "300px", display: "flex" }}>
          <FileUploadComponent selectedSession={selectedSession} selectedFileIds={selectedFileIds} setSelectedFileIds={setSelectedFileIds} />
        </div>
        <div style={{ flexGrow: 1, overflowX: "auto" }}>
          <Chat ref={chatRef} selectedSession={selectedSession} selectedFileIds={selectedFileIds} setSelectedFileIds={setSelectedFileIds} />
        </div>
      </div>
    </div>
  );
}

export default Home;
