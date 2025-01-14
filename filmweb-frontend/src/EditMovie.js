import React, { useState } from 'react';
import axios from 'axios';
import './EditMovie.css';

function EditMovie({ movie, onClose, onUpdate }) {
  const [title, setTitle] = useState(movie.title);
  const [description, setDescription] = useState(movie.description);
  const [genre, setGenre] = useState(movie.genre);
  const [releaseDate, setReleaseDate] = useState(movie.releaseDate?.split('T')[0]);
  const [director, setDirector] = useState(movie.director);
  const [error, setError] = useState('');

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:3001/api/movies/${movie.id}`,
        { title, description, genre, releaseDate, director },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      await onUpdate(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating movie');
    }
  };

  return (
    <div className="edit-movie-modal">
      <div className="edit-movie-content">
        <h2>Edit Movie</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            required
          />
          <select value={genre} onChange={(e) => setGenre(e.target.value)} required>
            <option value="">Select Genre</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            required
          />
          <input
            type="text"
            value={director}
            onChange={(e) => setDirector(e.target.value)}
            placeholder="Director"
            required
          />
          {error && <p className="error">{error}</p>}
          <div className="button-group">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMovie;