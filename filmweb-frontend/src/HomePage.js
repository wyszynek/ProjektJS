import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './style/HomePage.css';
import './style/Shared.css';

function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCriteria, setSortCriteria] = useState('title'); // Domyślnie sortowanie po tytule
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/movies', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setMovies(response.data);
        setLoading(false);
      } catch (error) {
        setError('Error loading movies');
        setLoading(false);
      }
    };
  
    fetchMovies();
  }, []);
  const handleRating = async (movieId, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/movies/${movieId}/rate`,
        { value },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      // Odśwież listę filmów
      const response = await axios.get('http://localhost:3001/api/movies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovies(response.data);
    } catch (error) {
      setError('Error rating movie: ' + error.message);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortCriteria(e.target.value);
  };

  const sortMovies = (movies) => {
    return [...movies].sort((a, b) => {
      switch (sortCriteria) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'genre':
          return a.genre.localeCompare(b.genre);
        case 'releaseDate':
          return new Date(b.releaseDate) - new Date(a.releaseDate); // Sortowanie od najnowszej do najstarszej
        default:
          return 0;
      }
    });
  };

  const filteredMovies = sortMovies(
    movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="home-page">
      <h1>Welcome to FilmWeb</h1>

      <div className="home-controls">
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="home-search-bar"
        />
        Sort By: 
        <select value={sortCriteria} onChange={handleSortChange} className="home-sort-dropdown">
          <option value="title">Title</option>
          <option value="genre">Genre</option>
          {/* <option value="popularity">Popularity</option> */}
          <option value="releaseDate">Release Date</option>
        </select>
      </div>

      <div className="home-movies-grid">
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => (
            <div key={movie.id} className="home-movie-card">
              <div className="home-movie-image-container" onClick={() => handleMovieClick(movie.id)}>
                {movie.imageUrl ? (
                  <img 
                    src={`http://localhost:3001/${movie.imageUrl}`}
                    alt={movie.title}
                    className="home-movie-image"
                  />
                ) : (
                  <div className="home-movie-image-placeholder">
                    <span>No image available</span>
                  </div>
                )}
              </div>
              <div className="home-movie-info">
                <h3>{movie.title}</h3>
                <div className="home-rating-section">
                  <p className="home-average-rating">
                    Average Rating: {movie.averageRating 
                      ? movie.averageRating.toFixed(1)
                      : 'No ratings'}
                  </p>
                  {isLoggedIn && (
                    <>
                      <p>Your Rating:</p>
                      <StarRating
                        initialRating={movie.userRating || 0}
                        onRatingChange={(value) => handleRating(movie.id, value)}
                        userRating={movie.userRating}
                      />
                    </>
                  )}
                </div>
                <div className="home-movie-details">
                  <p><strong>Director:</strong> {movie.director}</p>
                  <p><strong>Genre:</strong> {movie.genre}</p>
                  <p><strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}</p>
                </div>
                <p className="home-movie-description">{movie.description}</p>
                <p className="home-movie-added-by">Added by: {movie.User?.userName}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="home-no-movies">No movies found</div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
