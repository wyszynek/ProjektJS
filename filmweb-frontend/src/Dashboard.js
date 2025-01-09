import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import './Shared.css';

function Dashboard() {
  const [ratedMovies, setRatedMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);  // Stan dla obejrzanych filmów
  const [avatarFile, setAvatarFile] = useState(null);

  // Fetch rated movies
  useEffect(() => {
    const fetchRatedMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/users/ratings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRatedMovies(response.data);
      } catch (error) {
        console.error('Error fetching rated movies:', error);
      }
    };

    fetchRatedMovies();
  }, []);

  // Fetch watched movies
  useEffect(() => {
    const fetchWatchedMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/users/watched', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchedMovies(response.data);
      } catch (error) {
        console.error('Error fetching watched movies:', error);
      }
    };

    fetchWatchedMovies();
  }, []);

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/users/avatar',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update user in localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      user.avatarUrl = response.data.avatarUrl;
      localStorage.setItem('user', JSON.stringify(user));

      window.location.reload(); // Refresh to show new avatar
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-profile-section">
        <h2>Your Profile</h2>
        <div className="dashboard-avatar-section">
          <div className="dashboard-avatar-container">
            {JSON.parse(localStorage.getItem('user'))?.avatarUrl ? (
              <img 
                src={`http://localhost:3001/${JSON.parse(localStorage.getItem('user')).avatarUrl}`}
                alt="User avatar"
                className="dashboard-avatar-image"
              />
            ) : (
              <div className="dashboard-avatar-placeholder">
                {JSON.parse(localStorage.getItem('user'))?.userName?.charAt(0)}
              </div>
            )}
          </div>
          <div className="dashboard-avatar-upload">
            <label htmlFor="avatar-input" className="dashboard-upload-button">
              Change Avatar
            </label>
            <input
              id="avatar-input"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Rated Movies Section */}
      <section className="dashboard-rated-section">
        <h2>Your Rated Movies</h2>
        <div className="dashboard-movies-grid">
          {ratedMovies.length > 0 ? (
            ratedMovies.map(rating => (
              <div key={rating.movieId} className="dashboard-movie-card">
                <Link to={`/movies/${rating.movieId}`} className="dashboard-movie-link">
                  <div className="dashboard-movie-image-container">
                    {rating.Movie?.imageUrl ? (
                      <img 
                        src={`http://localhost:3001/${rating.Movie.imageUrl}`}
                        alt={rating.Movie.title}
                        className="dashboard-movie-image"
                      />
                    ) : (
                      <div className="dashboard-movie-image-placeholder">
                        <span>No image available</span>
                      </div>
                    )}
                  </div>
                  <div className="dashboard-movie-info">
                    <h4>{rating.Movie?.title}</h4>
                    <div className="dashboard-rating-info">
                      <p>Your rating: {rating.value}/10</p>
                      <p>Rated on: {new Date(rating.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="dashboard-no-movies">You haven't rated any movies yet.</p>
          )}
        </div>
      </section>

      {/* Watched Movies Section */}
      <section className="dashboard-watched-section">
        <h2>Your Watched Movies</h2>
        <div className="dashboard-movies-grid">
          {watchedMovies.length > 0 ? (
            watchedMovies.map(movie => (
              <div key={movie.movieId} className="dashboard-movie-card">
                <Link to={`/movies/${movie.movieId}`} className="dashboard-movie-link">
                  <div className="dashboard-movie-image-container">
                    {movie.Movie?.imageUrl ? (
                      <img 
                        src={`http://localhost:3001/${movie.Movie.imageUrl}`}
                        alt={movie.Movie.title}
                        className="dashboard-movie-image"
                      />
                    ) : (
                      <div className="dashboard-movie-image-placeholder">
                        <span>No image available</span>
                      </div>
                    )}
                  </div>
                  <div className="dashboard-movie-info">
                    <h4>{movie.Movie?.title}</h4>
                    <div className="dashboard-watched-info">
                      <p>Watched on: {new Date(movie.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="dashboard-no-movies">You haven't watched any movies yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
