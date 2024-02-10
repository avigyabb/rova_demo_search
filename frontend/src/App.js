import React, { useState } from 'react';
import { TextField, IconButton } from '@mui/material'; // Importing TextField and IconButton from Material UI
import SearchIcon from '@mui/icons-material/Search'; // Importing the Search icon
import HelloWorld from './HelloWorld';
import './App.css';

function App() {
  const [query, setQuery] = useState(''); // State to hold the search query
  const [searchResults, setSearchResults] = useState([]); // State to hold the search results

  const handleSearch = async () => {
    // Implement your search logic here, e.g., fetching search results from an API
    // For demonstration purposes, let's just log the search query
    console.log("Searching for:", query);
    // You can update setSearchResults with the actual search results obtained
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <HelloWorld />
        <TextField
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Search..."
          autoFocus
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSearch} size="large">
                <SearchIcon />
              </IconButton>
            ),
          }}
        />
      </header>
    </div>
  );
}

export default App;
