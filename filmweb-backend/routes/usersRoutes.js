import express from 'express';
import { User, Movie, Comment, Rating, WatchedMovie } from '../models.js'; 
import verifyToken from '../middleware/verifyToken.js';
const router = express.Router();

//              RATING

// /api/users/ratings'
router.get('/ratings', verifyToken, async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      where: { userId: req.userId },
      include: [{ model: Movie }],
      order: [['createdAt', 'DESC']]
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ratings' });
  }
});




//             DODANE FILMY

// /api/users/added-movie
router.get('/added-movie', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const movies = await Movie.findAll({
      where: {
        userId: userId 
      }
    });
    
    if (!movies || movies.length === 0) {
      return res.status(404).send('No movies found');
    }
    
    res.status(200).json(movies);
  } catch (error) {
    console.error('Error fetching added movies:', error);
    res.status(500).send('Server error');
  }
});




//              OBEJRZANE FILMY

// /api/users/watched
router.get('/watched', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const watchedMovies = await WatchedMovie.findAll({
      where: { userId },
      include: [{ model: Movie, attributes: ['id', 'title', 'imageUrl'] }]
    });

    res.status(200).json(watchedMovies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching watched movies' });
  }
});

export default router;