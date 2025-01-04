import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './HomePage.css';
import './Shared.css';
function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newComments, setNewComments] = useState({});
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

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

  const handleRating = async (movieId, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/movies/${movieId}/rate`,
        { value },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      const response = await axios.get('http://localhost:3001/api/movies');
      setMovies(response.data);
    } catch (error) {
      setError('Error rating movie: ' + error.message);
    }
  };

  const handleAddComment = async (movieId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/movies/${movieId}/comments`,
        { content: newComments[movieId] },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setNewComments(prev => ({...prev, [movieId]: ''}));
      const response = await axios.get('http://localhost:3001/api/movies');
      setMovies(response.data);
    } catch (error) {
      setError('Error adding comment: ' + error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3001/api/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      const response = await axios.get('http://localhost:3001/api/movies');
      setMovies(response.data);
    } catch (error) {
      setError('Error deleting comment: ' + error.message);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="home-page">
      <h1>Welcome to FilmWeb</h1>
  
      <input
        type="text"
        placeholder="Search movies..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="home-search-bar"
      />
  
      <div className="home-movies-grid">
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => (
            <div key={movie.id} className="home-movie-card">
              <div className="home-movie-image-container">
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
                    Average Rating: {movie.ratings?.length > 0
                      ? (movie.ratings.reduce((sum, r) => sum + r.value, 0) / movie.ratings.length).toFixed(1)
                      : 'No ratings'}
                  </p>
                  {isLoggedIn && (
                    <StarRating
                      initialRating={movie.userRating || 0}
                      onRatingChange={(value) => handleRating(movie.id, value)}
                      userRating={movie.userRating}
                    />
                  )}
                </div>
                <div onClick={() => handleMovieClick(movie.id)} className="home-movie-details">
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