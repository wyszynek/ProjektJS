import React, { useState } from 'react';
import axios from 'axios';

const AddMovie = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Zakładając, że token jest zapisany w localStorage

    if (!token) {
      setError('You need to be logged in to add a movie');
      return;
    }

    const movieData = {
      title,
      description,
      genre,
      releaseDate,
    };

    try {
      const response = await axios.post(
        'http://localhost:3001/api/movies',
        movieData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess('Movie added successfully!');
      setError('');
      // Możesz tu wyczyścić formularz po udanym dodaniu filmu
      setTitle('');
      setDescription('');
      setGenre('');
      setReleaseDate('');
    } catch (err) {
      setError('Error adding movie');
      setSuccess('');
    }
  };

  return (
    <div>
      <h2>Add Movie</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Genre:</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Release Date:</label>
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Movie</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default AddMovie;
