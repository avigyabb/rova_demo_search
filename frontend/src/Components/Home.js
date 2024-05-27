import React, { useState, useEffect, useRef } from 'react';
import FileUploadComponent from './FileUpload';
import '../App.css';
import posthog from '../posthog.js';
import Chat from './Chat.js';
import Sessions from './Sessions.js';
import Sources from './Sources.js';
import ArrowButton from './ArrowButton.js';
import "../Styles/Home.css";

function Home() {
  const [selectedSession, setSelectedSession] = useState(localStorage.getItem('selectedSession') ? JSON.parse(localStorage.getItem('selectedSession')) : null);
  const [selectedFileIds, setSelectedFileIds] = useState(localStorage.getItem('selectedFileIds') ? JSON.parse(localStorage.getItem('selectedFileIds')) : []);
  const chatRef = useRef(null);
  const [documents, setDocuments] = useState([])
  const [chatLog, setChatLog] = useState([])
  const [isSidebarOpen, setSidebarOpen] = useState(localStorage.getItem('isSidebarOpen') ? JSON.parse(localStorage.getItem('isSidebarOpen')) : true);

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

  useEffect(() => {
    // Save to localStorage when selectedFileIds changes
    localStorage.setItem('selectedSession', JSON.stringify(selectedSession));
    console.log(localStorage);
    console.log(selectedSession)
  }, [selectedSession]);

  useEffect(() => {
    // Save to localStorage when selectedFileIds changes
    localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  return (
    <div className="main-container" style={{ display: "flex", flexDirection: "column", height: '100vh', width: "100%"}}>
      <div style={{ width: "100%" }}>
        <Sessions selectedSession={selectedSession} setSelectedSession={setSelectedSession} fetchChat={fetchChat} />
      </div>
      <div style={{display: "flex", flexGrow: 1, overflowY : "auto"}}>
        <ArrowButton onClick={setSidebarOpen} isSidebarOpen={isSidebarOpen} />
        { isSidebarOpen && 
        <div style={{ width: "300px", display: "flex" }}>
          <FileUploadComponent selectedSession={selectedSession} selectedFileIds={selectedFileIds} setSelectedFileIds={setSelectedFileIds} />
        </div>
        }
        <div style={{flexGrow : 1, overflowX : "auto", backgroundColor: "rgba(233,233,233,255)"}}>
          <Chat ref={chatRef} selectedSession={selectedSession} selectedFileIds={selectedFileIds} setSelectedFileIds={setSelectedFileIds} setDocuments = {setDocuments} chatLog = {chatLog} setChatLog = {setChatLog} />
        </div>
        {chatLog.length > 0 && (
        <div style = {{width : "300px", display : "flex"}}>
          <Sources documents = {documents}/>
        </div>)}
      </div>
    </div>
  );
}

export default Home;
