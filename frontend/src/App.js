import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Card, CardContent, IconButton, Typography, Box, CircularProgress } from '@mui/material';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileUploadComponent from './Components/FileUpload';
import './App.css';
import axios from 'axios';
import posthog from './posthog';
import Chat from './Components/Chat.js';

function App() {
  useEffect(() => {
    // Automatically start session recording when the component mounts
    posthog.capture('$pageview');
  }, []);

  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false); // State to track loading status
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const fetchData = async () =>  {
    try {
      setLoading(true); // Set loading to true when fetching data
      const params = {
        query: query
      };
      const response = await axios.get('http://localhost:8000/generate-response/', { params });
      setResponses(prevResponses => [{"query": query, "response": response.data.response }, ...prevResponses]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Set loading to false when data fetching is complete
    }
  };

  const handleSearch = async () => { 
    fetchData();
  };

  const handleLike = async () => {
    setLiked(true);
    setDisliked(false);
    try {
      const response = await axios.post('http://localhost:8000/like/');
      console.log(response)
    } catch (error) {
      console.error(error);
    }
  };


  const handleDislike = async () => {
    setLiked(false);
    setDisliked(true);
    try {
      const response = await axios.post('http://localhost:8000/dislike/');
      console.log(response)
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopy = async () => {
    try {
      const response = await axios.post('http://localhost:8000/copy/');
      console.log(response)
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegenerate = async () => {
    try {
      const response = await axios.post('http://localhost:8000/regenerate/');
      console.log(response)
    } catch (error) {
      console.error(error);
    }

    try {
      setLoading(true); // Set loading to true when fetching data
      const params = {
        query: responses[0].query
      };
      const response = await axios.get('http://localhost:8000/generate-response/', { params });
      setResponses(prevResponses => [{"query": responses[0].query, "response": response.data.response }, ...prevResponses]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Set loading to false when data fetching is complete
    }
  };

  const handleUpgradePlan = async () => {
    try {
      const response = await axios.post('http://localhost:8000/upgrade/');
      console.log(response)
    } catch (error) {
      console.error(error);
    }
  };

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

export default App;
