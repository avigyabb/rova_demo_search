import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [error, setError] = useState('');

  const handleAuth = async (event) => {
    event.preventDefault();
    const url = isLogin ? 'login-user/' : 'register-user/';
    try {
      const response = await axios.post(process.env.REACT_APP_API_URL + url, {
        username: username,
        password: password,
        ...(isLogin ? {} : { email: email }) // Include email if registering
      }, {
        withCredentials: true
      });
      console.log(response.data);
      navigate(`${process.env.REACT_APP_AUTH_HEADER}/sessions`);
    } catch (error) {
      console.log(error);
      setError(error.response.data);
    }
  };

  return (
    <div className="min-h-screen flex mt-40">
      <form onSubmit={handleAuth} className="w-full max-w-sm">
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
        <div className="mb-4" style={{ display: !isLogin ? 'block' : 'none' }}>
          <label className="block text-white text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            className="button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit">
            {isLogin ? 'Login' : 'Register'}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="button bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Switch to {isLogin ? 'Register' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Auth;