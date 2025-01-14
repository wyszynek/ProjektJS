import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './style/PopularityRankPage.css';

function PopularityRankPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/movies');
        // Posortowanie filmów według średniej oceny (popularność)
        const sortedMovies = response.data.sort((a, b) => {
          const ratingA = a.ratings?.reduce((sum, r) => sum + r.value, 0) / a.ratings?.length || 0;
          const ratingB = b.ratings?.reduce((sum, r) => sum + r.value, 0) / b.ratings?.length || 0;
          return ratingB - ratingA; // Sortowanie malejąco po popularności
        });
        setMovies(sortedMovies);
        setLoading(false);
      } catch (error) {
        setError('Error loading movies');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="popularity-rank-page">
      <h1>Top Movies by Popularity</h1>
      <div className="popularity-movies-grid">
        {movies.length > 0 ? (
          movies.map((movie, index) => (
            <div key={movie.id} className="popularity-movie-card" onClick={() => handleMovieClick(movie.id)}>
              <div className="popularity-movie-rank">
                {index + 1}
              </div>
              <div className="popularity-movie-image-container">
                {movie.imageUrl ? (
                  <img
                    src={`http://localhost:3001/${movie.imageUrl}`}
                    alt={movie.title}
                    className="popularity-movie-image"
                  />
                ) : (
                  <div className="popularity-movie-image-placeholder">
                    <span>No image available</span>
                  </div>
                )}
              </div>
              <div className="popularity-movie-info">
                <h3>{movie.title}</h3>
                <p>
                  <strong>Average Rating:</strong> {movie.ratings?.length > 0
                    ? (movie.ratings.reduce((sum, r) => sum + r.value, 0) / movie.ratings.length).toFixed(1)
                    : 'No ratings'}
                </p>
                <p>
                  <strong>Genre:</strong> {movie.genre}
                </p>
                <p>
                  <strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}
                </p>
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

export default PopularityRankPage;
