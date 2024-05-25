import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Styles/FileUpload.css";
import { REACT_APP_API_URL } from "../consts";
import CircularProgress from '@mui/material/CircularProgress'; // Assuming you have Material-UI installed

const Sessions = ({ selectedSession, setSelectedSession, fetchChat }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await fetch(REACT_APP_API_URL + 'chat-sessions/');
      const result = await response.json();
      setSessions(result);
      if (result.length > 0) {
        const latestSession = result[result.length - 1];
        setSelectedSession(latestSession);
        fetchChat(); // Fetch chat history for the latest session
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await axios.post(REACT_APP_API_URL + "create-chat-session/", {
        body: 'New Chat',
      });
      if (response.status === 201) {
        await fetchSessions();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
        const response = await fetch(REACT_APP_API_URL + `delete-chat-session/${sessionId}/`, {
          method: 'DELETE',
        });
        if (response.status === 204) {
            fetchSessions();
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    fetchChat(session.id); // Fetch chat history for the selected session
    console.log("Session clicked:", session);
  };

  return (
    <div style={{
      width: '250px',
      backgroundColor: '#f0f0f0',
      padding: '20px',
      borderRight: '1px solid black',
      overflowY: 'auto'
    }}>
      <button onClick={handleNewChat} style={{ margin: '0px' }} className="custom-file-input">New Chat</button>
      <div style={{ marginTop: '20px' }}>
        <h1 style={{ fontWeight: 'bold' }}>Chat Sessions</h1>
        {loading ? (
          <CircularProgress />
        ) : (
          <ul style={{ padding: '0', listStyleType: 'none', margin: '0' }}>
            {sessions.slice().reverse().map((session, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0', padding: '0' }}>
                <button 
                  onClick={() => handleSessionClick(session)} 
                  className={`session-button ${selectedSession === session ? 'selected' : ''}`}
                  style={{ flexGrow: 1 }}
                >
                  {session.name}
                </button>
                <button 
                  onClick={() => handleDeleteSession(session.id)} 
                  style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sessions;
