import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tabs, Tab, Box, IconButton, CircularProgress, Typography, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import "../Styles/FileUpload.css";
import { REACT_APP_API_URL } from "../consts";

const Sessions = ({ selectedSession, setSelectedSession, fetchChat }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renamingSessionId, setRenamingSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');

  const handleChange = (event, newValue) => {
    const session = sessions[newValue];
    setSelectedSession(session);
    fetchChat(session.id);
  };

  const fetchSessions = async (selectIndex = -1) => {
    try {
      const response = await fetch(REACT_APP_API_URL + 'chat-sessions/');
      const result = await response.json();
      setSessions(result.map((session, index) => ({ ...session, name: session.name })));
      
      if (result.length > 0) {
        const sessionToSelect = selectIndex >= 0 && selectIndex < result.length ? result[selectIndex] : result[result.length - 1];
        setSelectedSession(sessionToSelect);
        fetchChat(sessionToSelect.id); // Fetch chat history for the selected session
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
        body: '',
      });
      if (response.status === 201) {
        await fetchSessions(); // Refresh sessions after creating a new one
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSession = async (sessionId, event) => {
    try {
      const sessionIndex = sessions.findIndex(session => session.id === sessionId);
      const curIndex = sessions.findIndex(session => session.id === selectedSession?.id);

      const response = await axios.delete(REACT_APP_API_URL + `delete-chat-session/${sessionId}/`);
      if (response.status === 204) {
        // Session selection logic
        let newSelectIndex = -1;
        if (curIndex === sessionIndex) {
          if (sessions.length === 1) {
            newSelectIndex = -1;
          } else if (sessionIndex === sessions.length - 1) {
            newSelectIndex = sessionIndex - 1;
          } else {
            newSelectIndex = sessionIndex;
          }
        } else {
            if (curIndex > sessionIndex) {
              newSelectIndex = curIndex - 1;
            } else {
              newSelectIndex = curIndex;
            }
        }
        await fetchSessions(newSelectIndex); // Refresh sessions after deleting one
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleRenameSession = async (sessionId, newName) => {
    try {
      const response = await axios.post(REACT_APP_API_URL + `rename-chat-session/${sessionId}/`, {
        name: newName,
      });
      if (response.status === 204) { // Note that Response(status=status.HTTP_204_NO_CONTENT) returns 204 status
        await fetchSessions(sessions.findIndex(session => session.id === selectedSession?.id));
      }
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };  

  const toggleRenameMode = (sessionId) => {
    setRenamingSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    setNewSessionName(session.name);
  };

  const handleRenameChange = (event) => {
    setNewSessionName(event.target.value);
  };

  const handleRenameSubmit = (sessionId) => {
    handleRenameSession(sessionId, newSessionName);
    setRenamingSessionId(null);
  };

  useEffect(() => {
    fetchSessions(0);
  }, []);

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%', height : "10vh", display: 'flex', alignItems: 'center' }}>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Tabs
            value={sessions.findIndex(session => session.id === selectedSession?.id)}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {sessions.map((session, index) => (
              <Tab
                key={session.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renamingSessionId === session.id ? (
                      <TextField
                        value={newSessionName}
                        onChange={handleRenameChange}
                        onBlur={() => handleRenameSubmit(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSubmit(session.id);
                          }
                        }}
                        size="small"
                        autoFocus
                        sx={{ flexGrow: 1 }}
                      />
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ flexGrow: 1 }}
                        onDoubleClick={() => toggleRenameMode(session.id)}
                      >
                        {session.name}
                      </Typography>
                    )}
                    <IconButton
                      onClick={(event) => handleDeleteSession(session.id, event)}
                      size="small"
                      sx={{ ml: 1, p: 0, '&:hover': { backgroundColor: 'transparent' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              />
            ))}
          </Tabs>
          <IconButton onClick={handleNewChat} sx={{ ml: 1 }}><AddIcon /></IconButton>
        </>
      )}
    </Box>
  );
};

export default Sessions;
