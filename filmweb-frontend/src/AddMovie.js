import React, { useState } from 'react';
import axios from 'axios';

function AddMovie() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [director, setDirector] = useState('');  // Nowe pole dla reżysera
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      setMessage('You must be logged in to add a movie.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3001/api/movies', // Endpoint API do dodawania filmu
        { title, director, description, genre, releaseDate },  // Dodajemy director
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message || 'Movie added successfully');
    } catch (error) {
      setMessage(error.response.data.message || 'An error occurred');
    }
  };

  return (
    <div>
      <h2>Add New Movie</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          required
        />
        <input
          type="date"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Director"  // Pole dla reżysera
          value={director}
          onChange={(e) => setDirector(e.target.value)}
          required
        />
        <button type="submit">Add Movie</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default AddMovie;
