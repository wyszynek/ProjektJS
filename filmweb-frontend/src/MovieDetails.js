import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './MovieDetails.css';
import './Shared.css';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState(null);
  const [isWatched, setIsWatched] = useState(false); 
  const isLoggedIn = !!localStorage.getItem('token');
  const [isMovieCreator, setIsMovieCreator] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [targetItemId, setTargetItemId] = useState(null);
  
  const navigate = useNavigate();

  const fetchMovieDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/movies/${id}`);
      setMovie(response.data);

      if (isLoggedIn) {
        const userRating = response.data.ratings?.find(
          r => r.userId === JSON.parse(localStorage.getItem('user'))?.id
        )?.value;
        setUserRating(userRating || null);

        const token = localStorage.getItem('token');
        const watchedResponse = await axios.get(`http://localhost:3001/api/movies/${id}/watched`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWatched(watchedResponse.data.isWatched);

        const loggedInUserId = JSON.parse(localStorage.getItem('user'))?.id;
        if (response.data.userId === loggedInUserId) {
          setIsMovieCreator(true);
        }
      }
    } catch (error) {
      setError('Error fetching movie details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = () => {
    setShowModal(true);
    setModalAction('deleteMovie');
  };

  const handleDeleteConfirmed = async () => {
    if (modalAction === 'deleteMovie') {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/movies/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/');
      } catch (error) {
        setError('Error deleting movie: ' + error.message);
      }
    } else if (modalAction === 'deleteRating') {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/movies/${id}/rate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserRating(null); 
        fetchMovieDetails();
      } catch (error) {
        setError('Error removing rating: ' + error.message);
      }
    } else if (modalAction === 'deleteComment') {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/movies/${id}/comments/${targetItemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchMovieDetails();
      } catch (error) {
        setError('Error deleting comment: ' + error.message);
      }
    }

    setShowModal(false); 
  };

  const handleCancelAction = () => {
    setShowModal(false); 
  };

  const handleRating = async (value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/movies/${id}/rate`, 
        { value }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setUserRating(value);
      fetchMovieDetails(); 
    } catch (error) {
      setError('Error rating movie: ' + error.message);
    }
  };

  const handleRemoveRating = () => {
    setShowModal(true);
    setModalAction('deleteRating');
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

  const handleDeleteComment = (commentId) => {
    setTargetItemId(commentId);
    setShowModal(true);
    setModalAction('deleteComment');
  };

  const handleMarkAsWatched = async () => {
    try {
      const token = localStorage.getItem('token');
      if (isWatched) {
        await axios.delete(`http://localhost:3001/api/movies/${id}/watched`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWatched(false);
      } else {
        await axios.post(`http://localhost:3001/api/movies/${id}/watched`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWatched(true);
      }
    } catch (error) {
      setError('Error marking movie as watched: ' + error.message);
    }
  };
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleUpdateMovie = (updatedMovie) => {
    setMovie(updatedMovie);
    setIsEditing(false);
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
        <h1>{movie.title}</h1>
        {movie.imageUrl ? (
          <img 
            className="movie-image"
            src={`http://localhost:3001/${movie.imageUrl}`}
            alt={movie.title}
          />
        ) : (
          <div className="dashboard-movie-image-placeholder">
            <span>No image available</span>
          </div>
        )}
        <h3 className="average-rating">Average Rating: {averageRating}</h3>
        <div className="rating-section">
          {isLoggedIn ? (
            <>
              <p>Your Rating:</p>
              <StarRating
                initialRating={userRating}
                onRatingChange={handleRating}
                userRating={userRating}
              />
                    {userRating !== null && (
        <button onClick={handleRemoveRating} className="remove-rating-btn">
          Remove Rating
        </button>
      )}
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

      <div className="movie-actions">
        {isLoggedIn && (
          <button onClick={handleMarkAsWatched} className="mark-watched-btn">
            {isWatched ? 'Cancel Watched' : 'Mark as Watched'}
          </button>
        )}

        {isMovieCreator && isLoggedIn &&(
          <button onClick={handleDeleteMovie} className="delete-movie-btn">
            Delete Movie
          </button>
        )}
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
            movie.comments.map((comment) => {
              const loggedInUser = JSON.parse(localStorage.getItem('user'));
              const isUserComment = loggedInUser && comment.userId === loggedInUser.id;

              return (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <div className="user-profile">
                      <div className="user-avatar">
                        <div className="avatar-placeholder">
                          {comment.User?.userName?.charAt(0)}
                        </div>
                      </div>
                      <span className="user-name">{comment.User?.userName}</span>
                    </div>

                    {isLoggedIn && isUserComment && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="delete-comment-btn">
                        Delete
                      </button>
                    )}
                  </div>

                  <p className="comment-content">{comment.content}</p>
                  <small className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </small>
                </div>
              );
            })
          ) : (
            <p>No comments yet.</p>
          )}
        </div>
      </div>

      {showModal && (
        <ConfirmationModal
          message={
            modalAction === 'deleteMovie'
              ? "Are you sure you want to delete this movie?"
              : modalAction === 'deleteRating'
              ? "Are you sure you want to remove your rating?"
              : "Are you sure you want to delete this comment?"
          }
          onConfirm={handleDeleteConfirmed}
          onCancel={handleCancelAction}
        />
      )}

    </div>
  );
}

export default MovieDetails;
