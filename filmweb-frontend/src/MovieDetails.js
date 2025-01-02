import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './MovieDetails.css';

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState(null);
  const isLoggedIn = !!localStorage.getItem('token');

  const fetchMovieDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/movies/${id}`);
      setMovie(response.data);
      
      if (isLoggedIn) {
        const token = localStorage.getItem('token');
        try {
          const userRatingResponse = await axios.get(
            `http://localhost:3001/api/movies/${id}/userRating`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          setUserRating(userRatingResponse.data.rating);
        } catch (ratingError) {
          console.error('Error fetching user rating:', ratingError);
        }
      }
    } catch (error) {
      setError('Error fetching movie details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/movies/${id}/rate`, 
        { value }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setUserRating(value);
      fetchMovieDetails(); // Refresh to get updated average rating
    } catch (error) {
      setError('Error rating movie: ' + error.message);
    }
  };

  const handleAddComment = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/movies/${id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setNewComment('');
      fetchMovieDetails();
    } catch (error) {
      setError('Error adding comment: ' + error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMovieDetails();
    } catch (error) {
      setError('Error deleting comment: ' + error.message);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [id, isLoggedIn]);

  if (loading) return <p>Loading movie details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!movie) return <p>Movie not found.</p>;

  const averageRating = movie.ratings?.length > 0
    ? (movie.ratings.reduce((sum, rating) => sum + rating.value, 0) / movie.ratings.length).toFixed(1)
    : 'No ratings yet';

  return (
    <div className="movie-details-container">
      <div className="movie-header">
        <h2>{movie.title}</h2>
        <div className="rating-section">
          <p className="average-rating">Average Rating: {averageRating}</p>
          {isLoggedIn ? (
            <>
              <p>Your Rating:</p>
              <StarRating
                initialRating={userRating}
                onRatingChange={handleRating}
                userRating={userRating}
              />
            </>
          ) : (
            <p className="login-prompt">Login to rate this movie</p>
          )}
        </div>
      </div>

      <div className="movie-info">
        <p><strong>Director:</strong> {movie.director}</p>
        <p><strong>Genre:</strong> {movie.genre}</p>
        <p><strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}</p>
        <p><strong>Description:</strong> {movie.description}</p>
      </div>

      <div className="comments-section">
    <h3>Comments</h3>
    {isLoggedIn && (
      <div className="add-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
        />
        <button onClick={handleAddComment}>Post Comment</button>
      </div>
    )}

    <div className="comments-list">
      {movie.comments && movie.comments.length > 0 ? (
        movie.comments.map((comment) => (
          <div key={comment.id} className="comment-card">
            <div className="comment-header">
              <div className="user-profile">
                <div className="user-avatar">
                  {/* Placeholder for future avatar */}
                  <div className="avatar-placeholder">
                    {comment.User?.userName?.charAt(0)}
                  </div>
                </div>
                <span className="user-name">{comment.User?.userName}</span>
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
            <p className="comment-content">{comment.content}</p>
            <small className="comment-date">
              {new Date(comment.createdAt).toLocaleDateString()}
            </small>
          </div>
        ))
      ) : (
        <p>No comments yet.</p>
      )}
    </div>
  </div>
    </div>
  );
}

export default MovieDetails;