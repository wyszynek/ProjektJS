import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [ratedMovies, setRatedMovies] = useState([]);

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

  return (
    <div>
      <h2>Your Dashboard</h2>
      <section className="rated-movies">
        <h3>Your Rated Movies</h3>
        <div className="movies-grid">
          {ratedMovies.map(rating => (
            <div key={rating.movieId} className="movie-card">
              <Link to={`/movies/${rating.movieId}`}>
                <h4>{rating.Movie.title}</h4>
                <div className="rating-info">
                  <p>Your rating: {rating.value}/10</p>
                  <p>Rated on: {new Date(rating.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;