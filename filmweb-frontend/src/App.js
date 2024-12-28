import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import AddMovie from './AddMovie';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Stan logowania
  const [loading, setLoading] = useState(true); // Stan ładowania, żeby nie renderować komponentów przed sprawdzeniem logowania

  // Używamy useEffect, żeby sprawdzić token po załadowaniu komponentu
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(token ? true : false); // Jeśli token istnieje, to użytkownik jest zalogowany
    setLoading(false); // Po zakończeniu ładowania ustawiamy loading na false
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false); 
  };

  if (loading) {
    return <div>Loading...</div>; // Wyświetlamy loading zanim sprawdzimy stan logowania
  }

  return (
    <Router>
      <div>
        <header>
          <h1>FilmWeb Portal</h1>
          <nav>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard">Dashboard</Link> | 
                <Link to="/addmovie">Add Movie</Link> | 
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/register">Register</Link> | 
                <Link to="/login">Login</Link>
              </>
            )}
          </nav>
        </header>

        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          
          {/* Przekierowanie na dashboard, jeśli użytkownik jest zalogowany */}
          <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/addmovie" element={isLoggedIn ? <AddMovie /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
