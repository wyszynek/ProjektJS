import React, { useState } from 'react';
import axios from 'axios';
import './AddMovie.css';
import './Shared.css';
function AddMovie() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [director, setDirector] = useState('');  // Nowe pole dla reżysera
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
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
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      setMessage(response.data.message || 'Movie added successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="add-movie">
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
        <select
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
        <button type="submit">Add Movie</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default AddMovie;
