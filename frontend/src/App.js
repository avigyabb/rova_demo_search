import React, { useState } from 'react';
import { Container, TextField, Button, Card, CardContent, IconButton, Typography, Box } from '@mui/material';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import CommentIcon from '@mui/icons-material/Comment';
import DownloadIcon from '@mui/icons-material/Download'; // Import the Download icon
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState([]);

  const handleSearch = async () => {
    const aiResponse = await getAIResponse(query);
    // Prepend new response and keep only the 5 most recent responses
    setResponses(prevResponses => [{ query, aiResponse }, ...prevResponses.slice(0, 0)]);
  };

  return (
    <Container maxWidth="sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '90vh' }}>
      {responses.map((response, index) => (
        <Card key={index} className="response-card" style={{ marginTop: '50px', height: '65vh'}}>
          <CardContent style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '95%' }}>
            <Typography variant="body1">{response.aiResponse}</Typography>
            <Typography variant="body2" style={{ marginTop: '10px', marginBottom: '10px' }}>{response.citation}</Typography>
            {/* Actions are now wrapped in a Box for alignment */}
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
              <IconButton aria-label="like"><ThumbUpAltIcon /></IconButton>
              <IconButton aria-label="dislike"><ThumbDownAltIcon /></IconButton>
              <IconButton aria-label="comment"><CommentIcon /></IconButton>
              <IconButton aria-label="download">
                <DownloadIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
      {/* Adjust the search container to display elements inline */}
      <div className="search-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', marginBottom: '20px'}}>
        <TextField label="Ask me anything..." fullWidth value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button variant="contained" color="primary" onClick={handleSearch}>Search</Button>
      </div>
    </Container>
  );
}

async function getAIResponse(query) {
  // Placeholder for AI response logic
  return `Response to "${query}"`;
}

export default App;
