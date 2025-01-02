import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import nawigacji
import axios from 'axios';
import './HomePage.css';
import StarRating from './StarRating';
function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate(); // Hook do nawigacji
  const isLoggedIn = !!localStorage.getItem('token');

  const handleRating = async (movieId, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/movies/${movieId}/rate`,
        { value },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      // Refresh movies to update ratings
      const response = await axios.get('http://localhost:3001/api/movies');
      setMovies(response.data);
    } catch (error) {
      setError('Error rating movie: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/movies');
        setMovies(response.data);
        setLoading(false);
      } catch (error) {
        setError('Error loading movies');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filtruj filmy na podstawie wyszukiwanego zapytania
  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Funkcja przekierowująca do MovieDetails
  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="home-page">
      <h1>Welcome to FilmWeb</h1>

      {/* Pole wyszukiwania */}
      <input
        type="text"
        placeholder="Search movies..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-bar"
      />

<div className="movies-grid">
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <h3>{movie.title}</h3>
              <div className="movie-info">
                {/* Calculate average rating */}
                <div className="rating-section">
                  <p className="average-rating">
                    Average Rating: {movie.ratings?.length > 0
                      ? (movie.ratings.reduce((sum, r) => sum + r.value, 0) / movie.ratings.length).toFixed(1)
                      : 'No ratings'}
                  </p>
                  {isLoggedIn && (
                    <div className="user-rating">
                      <StarRating
                        initialRating={movie.ratings?.find(r => r.userId === JSON.parse(localStorage.getItem('user'))?.id)?.value || 0}
                        onRatingChange={(value) => handleRating(movie.id, value)}
                        userRating={movie.ratings?.find(r => r.userId === JSON.parse(localStorage.getItem('user'))?.id)?.value}
                      />
                    </div>
                  )}
                </div>
                <div 
                  onClick={() => handleMovieClick(movie.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <p><strong>Director:</strong> {movie.director}</p>
                  <p><strong>Genre:</strong> {movie.genre}</p>
                  <p><strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="movie-description">{movie.description}</p>
              <p className="movie-added-by">Added by: {movie.User?.userName}</p>
            </div>
          ))
        ) : (
          <div>No movies found</div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
