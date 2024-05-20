import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(process.env.REACT_APP_API_URL + 'login-user/', {
        username: username,
        password: password
      }, {
        withCredentials: true // This is the key addition to support credentials
      });
      console.log(response.data); // Handle the response data here
      navigate(`${process.env.REACT_APP_AUTH_HEADER}/sessions`); // Navigate after a successful login
    } catch (error) {
      console.log(error); // Handle errors here
      // Don't navigate, handle the error (e.g., display an error message)
    }
  };

  return (
    <div className="min-h-screen flex mt-40">
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <div className="mb-4">
          <label className="block text-white text-sm font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-white text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 text-xs italic">{error}</p>}
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit">
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Auth;