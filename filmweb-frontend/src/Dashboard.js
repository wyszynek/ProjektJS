import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Dashboard.css'; 
function Dashboard() {
  const [ratedMovies, setRatedMovies] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);

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
      <div className="profile-section">
        <h2>Your Profile</h2>
        <div className="avatar-section">
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
          <div className="avatar-upload">
            <label htmlFor="avatar-input" className="upload-button">
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
  
      <section className="rated-movies-section">
        <h2>Your Rated Movies</h2>
        <div className="movies-grid">
          {ratedMovies.length > 0 ? (
            ratedMovies.map(rating => (
              <div key={rating.movieId} className="movie-card">
                <Link to={`/movies/${rating.movieId}`}>
                  <h4>{rating.Movie.title}</h4>
                  <div className="rating-info">
                    <p>Your rating: {rating.value}/10</p>
                    <p>Rated on: {new Date(rating.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="no-movies">You haven't rated any movies yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;