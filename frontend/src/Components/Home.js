import React, { useState, useEffect, useRef } from 'react';
import FileUploadComponent from './FileUpload';
import '../App.css';
import posthog from '../posthog.js';
import Chat from './Chat.js';
import Sessions from './Sessions.js';
import Sources from './Sources.js';
import ArrowButton from './ArrowButton.js';
import UserDropdown from './UserDropdown'; // Import the new UserDropdown component
import TextEditor from './TextEditor.js';
import Form from './Form.js';
import "../Styles/Home.css";
import { useNavigate } from 'react-router-dom';
import {REACT_APP_API_URL} from "../consts";

function Home() {
  const navigate = useNavigate();
  const [selectedFileIds, setSelectedFileIds] = useState(sessionStorage.getItem('selectedFileIds') ? JSON.parse(sessionStorage.getItem('selectedFileIds')) : []);
  const [userName, setUsername] = useState(localStorage.getItem('username'));
  const chatRef = useRef(null);
  const [documents, setDocuments] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(sessionStorage.getItem('isSidebarOpen') ? JSON.parse(sessionStorage.getItem('isSidebarOpen')) : true);
  const [isEditorOpen, setEditorOpen] = useState(false); // State to control TextEditor visibility
  const [showPopup, setShowPopup] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Use local state if props are not provided
  const [selectedSession, setSelectedSession] = useState(sessionStorage.getItem('selectedSession') ? JSON.parse(sessionStorage.getItem('selectedSession')) : null);

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
    console.log(localStorage.getItem('accessToken'))
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    // Save to sessionStorage when selectedFileIds changes
    sessionStorage.setItem('selectedFileIds', JSON.stringify(selectedFileIds));
  }, [selectedFileIds]);

  useEffect(() => {
    // Save to sessionStorage when selectedFileIds changes
    sessionStorage.setItem('selectedSession', JSON.stringify(selectedSession));
  }, [selectedSession]);

  useEffect(() => {
    // Save to sessionStorage when selectedFileIds changes
    sessionStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const toggleEditor = () => {
    setEditorOpen(prev => !prev); // Toggle editor visibility
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    window.location.reload();
  };

  const answerTemplateQuestions = async(event) => {
    const newFiles = Array.from(event.target.files)
    for (const file of newFiles) {
      const formData = new FormData();
      formData.append('file', file)
      formData.append('selectedFileIds', JSON.stringify(selectedFileIds))
      formData.append('questions', JSON.stringify(['']))
      formData.append('chat_session', JSON.stringify(selectedSession.id))
      formData.append('file_organization', undefined)
      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(REACT_APP_API_URL + `upload/1/`, {
          method : 'POST',
          body : formData,
          headers : {
            Authorization : `Bearer ${accessToken}`
          }
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setShowPopup(true);
      } catch (error) {
        console.error('Error uploading files:', error)
      }
    }
  }

  return (
    <div className="main-container" style={{ display: "flex", flexDirection: "column", height: '100vh', width: "100%"}}>

      {showPopup && (
        <div style={{
          position: 'fixed',
          top: '47.5%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '90%',
          backgroundColor: 'white',
          overflow: 'scroll',
          zIndex: 1001,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          padding: '37px',
          boxSizing: 'border-box'
        }}>
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '100%'}}
            frameBorder="0"
          />
          <button
            onClick={() => handleClosePopup()}
            style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1001}}
          >
            Close
          </button>
          <a href={pdfUrl} download="grant_application.pdf" style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1001}}>
            Download PDF
          </a>
        </div>
      )}

      <div style={{ width: "100%", position: "relative", zIndex: 11 }}>
        <Sessions selectedSession={selectedSession} setSelectedSession={setSelectedSession} fetchChat={fetchChat} />
        <div style={{ position: "absolute", right: "240px", top: "15px" }}>
          <a className="toggle-button" href="/data-extraction">Extract Data</a>
        </div>
        <div style={{ position: "absolute", right: "140px", top: "15px" }}>
          <button onClick={toggleEditor} className="toggle-button">
            {isEditorOpen ? 'Close Editor' : 'Open Editor'}
          </button>
        </div>
        <div style={{ position: "absolute", right: "10px", top: "10px" }}>
          {userName && <UserDropdown userName={userName} />}
        </div>
      </div>
      {/* <div className={`${isEditorOpen ? 'app' : ''}`}> */}
      <div className={`${isEditorOpen ? 'split left' : ''}`} style={{display: "flex", flexGrow: 1, overflowY : "auto", position: "relative", zIndex: 1 }}>
        <ArrowButton onClick={setSidebarOpen} isSidebarOpen={isSidebarOpen} />
        { isSidebarOpen && 
        <div style={{ width: "300px", display: "flex", position: 'relative', zIndex: 10 }}>
          <FileUploadComponent selectedSession={selectedSession} selectedFileIds={selectedFileIds} setSelectedFileIds={setSelectedFileIds} setShowPopup={setShowPopup} setPdfUrl={setPdfUrl}/>
          {/* <Form
            onClose={() => {}}
            handleUpload={() => {}}
            submitForm={() => {}}
            inputs={[]}
            setInputs={() => {}}
          /> */}
        </div>
        }
        <div style={{flexGrow : 1, overflowX : "auto", backgroundColor: "rgba(255,255,255,255)", position: "relative", zIndex: 1 }}>
          <Chat ref={chatRef} selectedSession={selectedSession} selectedFileIds={selectedFileIds} setSelectedFileIds={setSelectedFileIds} setDocuments = {setDocuments} chatLog = {chatLog} setChatLog = {setChatLog} answerTemplateQuestions = {answerTemplateQuestions} />
        </div>
        {documents && (
        <div style = {{width : "300px", display : "flex", position : "relative", zIndex : 2}}>
          <Sources documents = {documents}/>
        </div>)}
        {isEditorOpen && (
          <div style={{ width: '100%', backgroundColor: 'white' }}>
            <TextEditor selectedSession={selectedSession} />
          </div>
        )}
      </div>
      </div>
    // </div>
  );
}

export default Home;
