import express from 'express';
import { Sequelize, Op } from 'sequelize';
import { User, Movie, Comment, Rating, WatchedMovie } from '../models.js'; 
import jwt from 'jsonwebtoken'; 
import verifyToken from '../middleware/verifyToken.js';
import multer from 'multer'; //zapis przesłanych plików na serwerze (avatary i zdj filmów)
import path from 'path'; 
import fs from 'fs'; //odczytywanie, zapisywanie, usuwanie plików i folderów (znajdywanie zdjęć)

const router = express.Router();

//                      DANE FILMU

// /api/movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.findAll({
      include: [ // join z innymi tabelami (pozwala na dołączenie do wyników zapytania informacji o powiązanym obiekcie)
        { 
          model: Rating, 
          as: 'ratings', 
          attributes: ['value', 'userId']  //określenie porządku, w jakim wyniki zapytania mają zostać posortowane
        },
        { 
          model: User, 
          attributes: ['userName'] 
        },
      ],
    });

    // Sprawdzamy token i pobieramy userId jeśli istnieje
    const token = req.headers['authorization']?.split(' ')[1];
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.error('Token verification failed:', err);
      }
    }

    const moviesWithRatings = movies.map((movie) => {
      const movieJson = movie.toJSON();
      const ratings = movie.ratings.map((r) => r.value);
      const averageRating = ratings.length 
        ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length 
        : null;
      
      // Znajdź ocenę użytkownika jeśli istnieje
      const userRating = userId 
        ? movie.ratings.find(r => r.userId === userId)?.value 
        : null;

      return {
        ...movieJson,
        averageRating,
        userRating
      };
    });

    res.json(moviesWithRatings);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).send('Could not fetch movies');
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    if (movie.userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to edit this movie' });
    }

    await movie.update(req.body);
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Error updating movie' });
  }
});

// /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id, {
      include: [
        { model: Comment,  as: 'comments',
          include: [{ 
            model: User,
            attributes: ['userName']
          }], attributes: ['id', 'content', 'userId', 'createdAt'] },
        { model: Rating, as: 'ratings', attributes: ['id', 'value', 'userId'] },
        { model: User, attributes: ['userName'] },
      ],
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Obliczanie średniej oceny
    const ratings = movie.ratings.map((r) => r.value);
    const averageRating = ratings.length ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length : null;

    const userRating = movie.ratings.find((r) => r.userId === req.userId);

    res.json({
      ...movie.toJSON(),
      averageRating,
      userRating: userRating ? userRating.value : null,
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ message: 'An error occurred while fetching movie details' });
  }
});

// /api/movies/:id
router.delete('/:id', verifyToken, async (req, res) => {
  const movieId = req.params.id;
  const userId = req.userId;  

  try {
    const movie = await Movie.findByPk(movieId);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    if (movie.userId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this movie' });
    }

    await movie.destroy();
    
    res.status(200).json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting movie' });
  }
});

const movieStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'images/movies';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `movie-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadMovie = multer({
  storage: movieStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg and .png files are allowed!'));
    }
  }
});

router.post('/', uploadMovie.single('image'), verifyToken, async (req, res) => {
  try {
    const { title, director, description, genre, releaseDate } = req.body;
    
    if (!title || !description || !genre || !releaseDate || !director) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const movie = await Movie.create({
      title,
      director,
      description,
      genre,
      releaseDate,
      userId: req.userId,
      imageUrl: req.file ? `images/movies/${req.file.filename}` : null
    });

    res.status(201).json({ message: 'Movie added successfully', movie });
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'Error adding movie: ' + error.message });
  }
});




//                      RATING FILMU 

// wstawianie ratingu
// /api/movies/:id/rate
router.post('/:id/rate', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;
  const userId = req.userId;

  try {
    const rating = await Rating.findOne({ 
      where: { movieId: id, userId } 
    });

    if (rating) {
      await rating.update({ value });
    } else {
      await Rating.create({
        movieId: id,
        userId,
        value
      });
    }

    res.json({ message: 'Rating saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving rating' });
  }
});

// usuwanie oceny z danego filmu
// /api/movies/:movieId/rate
router.delete('/:movieId/rate', verifyToken, async (req, res) => {
  const { movieId } = req.params;
  const userId = req.userId;

  try {
    const rating = await Rating.destroy({
      where: { movieId, userId }
    });

    if (rating) {
      res.status(200).json({ message: 'Rating removed successfully.' });
    } else {
      res.status(404).json({ error: 'Rating not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error removing rating.' });
  }
});




//              KOMENTARZE FILMU

//  pobierz komentarz
// /api/movies/:id/comments
router.get('/:id/comments', async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const comments = await Comment.findAll({
      where: { movieId: id },
      include: [
        { model: User, attributes: ['id', 'userName'] } 
      ],
      order: [['createdAt', 'DESC']], // posortowanie wynikow po createdAt w porządku malejącym (DESC)
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'An error occurred while fetching comments' });
  }
});

//wstaw komentarz
// /api/movies/:id/comments'
router.post('/:id/comments', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const movie = await Movie.findByPk(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const comment = await Comment.create({
      content,
      movieId: id,
      userId: req.userId,
    });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'An error occurred while adding the comment' });
  }
});

// usun komentarz
// /api/movies/:movieId/comments/:commentId'
router.delete('/:movieId/comments/:commentId', verifyToken, async (req, res) => {
  const { movieId, commentId } = req.params;
  const userId = req.userId; 
  
  try {
    const comment = await Comment.findOne({ where: { id: commentId, movieId, userId } });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or you are not authorized to delete this comment' });
    }

    await comment.destroy(); 
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment: ' + error.message });
  }
});



//        WATCHED-NOT WATCHED

// /api/movies/:id/watched
// pobierz czy ogladany
router.get('/:id/watched', verifyToken, async (req, res) => {
  const movieId = req.params.id;
  const userId = req.userId; 

  try {
    const watchedMovie = await WatchedMovie.findOne({
      where: {
        movieId: movieId,
        userId: userId,
      },
    });

    if (watchedMovie) {
      return res.json({ isWatched: true });
    } else {
      return res.json({ isWatched: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error checking watched status' });
  }
});

// ustaw jako obejrzany
// /api/movies/:id/watched
router.post('/:id/watched', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const existingWatchedMovie = await WatchedMovie.findOne({
      where: {
        movieId: id,
        userId,
      },
    });

    if (existingWatchedMovie) {
      return res.status(400).json({ message: 'Movie already marked as watched' });
    }

    await WatchedMovie.create({
      movieId: id,
      userId,
    });

    res.status(201).json({ message: 'Movie marked as watched' });
  } catch (error) {
    console.error('Error marking movie as watched:', error);
    res.status(500).json({ message: 'Error marking movie as watched' });
  }
});

// usun z obejrzanych
// /api/movies/:id/watched
router.delete('/:id/watched', verifyToken, async (req, res) => {
  const movieId = req.params.id;
  const userId = req.userId;

  try {
    const deletedRecord = await WatchedMovie.destroy({
      where: {
        movieId: movieId,
        userId: userId,
      },
    });

    if (deletedRecord) {
      return res.status(200).json({ message: 'Movie removed from watched list' });
    } else {
      return res.status(404).json({ message: 'Movie not found in watched list' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error removing movie from watched list' });
  }
});

export default router;