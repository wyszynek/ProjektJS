import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setIsLoggedIn }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // // Wyczyszczenie starego tokena
  // React.useEffect(() => {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  // }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        identifier,
        password,
      });

      setMessage(response.data.message);
      localStorage.setItem('token', response.data.token); // Zapisujemy token w localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user)); // Zapisujemy użytkownika
      
      setIsLoggedIn(true); 
      navigate('/dashboard'); // Przejście na stronę użytkownika
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred'); // Obsługa błędu
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="User Name or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Login;
