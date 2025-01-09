import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import AddMovie from './AddMovie';
import HomePage from './HomePage';
import MovieDetails from './MovieDetails';
import PopularityRankPage from './PopularityRankPage';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Stan logowania
  const [loading, setLoading] = useState(true); // Stan ładowania, żeby nie renderować komponentów przed sprawdzeniem logowania
  const user = JSON.parse(localStorage.getItem('user'));

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
        <div className="header-left">
          <h1>FilmWeb Portal</h1>
        </div>
        <nav>
          <Link to="/">Home</Link> |
          <Link to="/popularity">Ranking</Link> |
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
        <nav>
            {isLoggedIn && (
                <div className="user-profile">
                <div className="nav-avatar-container">
                  {user?.avatarUrl ? (
                    <img 
                      src={`http://localhost:3001/${user.avatarUrl}`}
                      alt="User avatar"
                      className="nav-avatar-image"
                    />
                  ) : (
                    <div className="nav-avatar-placeholder">
                      {user?.userName?.charAt(0)}
                    </div>
                  )}
                </div>
                <Link to="/dashboard" className="username-link">
                  {user?.userName}
                </Link>
              </div>
            )}
            </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} /> {/* Add HomePage route */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/addmovie" element={isLoggedIn ? <AddMovie /> : <Navigate to="/login" />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/popularity" element={<PopularityRankPage />} />
      </Routes>
    </div>
  </Router>
  );
}

export default App;
