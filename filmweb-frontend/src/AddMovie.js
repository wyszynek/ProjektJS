import React, { useState } from 'react';
import axios from 'axios';
import './style//Shared.css';

function AddMovie() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [director, setDirector] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary'];
// Obsługa wyboru obrazu
  const handleImageChange = (e) => {
    const file = e.target.files[0]; // Pobranie pierwszego pliku z listy
    if (file) {
      setImage(file); // Ustawienie pliku w stanie komponentu
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      setMessage('You must be logged in to add a movie.');
      return;
    }

    if (!genre) {
      setMessage('Please select a valid genre.');
      return;
    }

    // Tworzenie obiektu FormData do przesłania danych formularza i obrazu
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('director', director);
      formData.append('description', description);
      formData.append('genre', genre);
      formData.append('releaseDate', releaseDate);
      if (image) {
        formData.append('image', image);
      }

      const response = await axios.post(
        'http://localhost:3001/api/movies',
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' // Ustawienie nagłówka dla danych typu FormData
          } 
        }
      );
      setMessage(response.data.message || 'Movie added successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Add New Movie</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="auth-input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <select
            className="auth-input"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            required
          >
            <option value="">Select Genre</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <input
            className="auth-input"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="text"
            placeholder="Director"
            value={director}
            onChange={(e) => setDirector(e.target.value)}
            required
          />
          <div className="image-upload">
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleImageChange}
              id="movie-image"
              style={{ display: 'none' }}
            />
            <label htmlFor="movie-image" className="upload-button">
              {imagePreview ? 'Change Image' : 'Add Movie Image'}
            </label>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>
          <button className="auth-button" type="submit">
            Add Movie
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
}

export default AddMovie;
