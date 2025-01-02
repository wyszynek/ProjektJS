import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './HomePage.css';

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
        className="search-bar"
      />

      <div className="movies-grid">
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <h3>{movie.title}</h3>
              <div className="movie-info">
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
                <div onClick={() => handleMovieClick(movie.id)} style={{ cursor: 'pointer' }}>
                  <p><strong>Director:</strong> {movie.director}</p>
                  <p><strong>Genre:</strong> {movie.genre}</p>
                  <p><strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="movie-description">{movie.description}</p>
              <p className="movie-added-by">Added by: {movie.User?.userName}</p>

              <div className="comments-section">
                <h4>Comments</h4>
                {isLoggedIn && (
                  <div className="add-comment">
                    <textarea
                      value={newComments[movie.id] || ''}
                      onChange={(e) => setNewComments(prev => ({
                        ...prev,
                        [movie.id]: e.target.value
                      }))}
                      placeholder="Add a comment..."
                    />
                    <button onClick={() => handleAddComment(movie.id)}>Post Comment</button>
                  </div>
                )}
                
                <div className="comments-list">
                  {movie.comments?.length > 0 ? (
                    movie.comments.map((comment) => (
                      <div key={comment.id} className="comment-card">
                        <div className="comment-header">
                          <div className="user-profile">
                            <div className="avatar-placeholder">
                              {comment.User?.userName?.charAt(0)}
                            </div>
                            <span>{comment.User?.userName}</span>
                          </div>
                          {comment.userId === JSON.parse(localStorage.getItem('user'))?.id && (
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="delete-comment"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <p>{comment.content}</p>
                        <small>{new Date(comment.createdAt).toLocaleDateString()}</small>
                      </div>
                    ))
                  ) : (
                    <p>No comments yet</p>
                  )}
                </div>
              </div>
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