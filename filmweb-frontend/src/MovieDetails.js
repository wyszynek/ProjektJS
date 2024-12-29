import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function MovieDetails() {
  const { id } = useParams(); // Pobieramy ID filmu z URL
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/movies/${id}`);
        setMovie(response.data);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (loading) {
    return <p>Loading movie details...</p>;
  }

  if (!movie) {
    return <p>Movie not found.</p>;
  }

  const averageRating =
    movie.ratings.length > 0
      ? (movie.ratings.reduce((sum, rating) => sum + rating.value, 0) / movie.ratings.length).toFixed(1)
      : 'No ratings yet';

  return (
    <div>
      <h2>{movie.title}</h2>
      <p><strong>Director:</strong> {movie.director}</p>
      <p><strong>Genre:</strong> {movie.genre}</p>
      <p><strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}</p>
      <p><strong>Description:</strong> {movie.description}</p>
      <p><strong>Average Rating:</strong> {averageRating}</p>

      <h3>Comments</h3>
      {movie.comments.length > 0 ? (
        <ul>
          {movie.comments.map((comment) => (
            <li key={comment.id}>
              <p>{comment.content}</p>
              <small>By User {comment.userId} on {new Date(comment.createdAt).toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No comments yet.</p>
      )}
    </div>
  );
}

export default MovieDetails;
