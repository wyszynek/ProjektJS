import express from 'express';
import cors from 'cors';
import { Sequelize, Op } from 'sequelize';
import { User, Movie, Comment, Rating, WatchedMovie } from './models.js'; 
import sequelize from './db.js';  
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; 
import multer from 'multer';
import path from 'path';
import fs from 'fs';
dotenv.config();

const app = express();
const PORT = 3001;
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

//rejestracja użytkownika
app.post('/api/auth/register', async (req, res) => {
  const { email, userName, password, firstName, lastName, birthDate } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const newUser = await User.create({
      email,
      userName,
      password,
      firstName,
      lastName,
      birthDate,
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'An error occurred during registration' });
  }
});

//logowanie użytkownika
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  try {
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email: identifier }, 
          { userName: identifier }
        ] 
      },
      attributes: ['id', 'userName', 'email', 'password', 'avatarUrl'] 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or username' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, userName: user.userName, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        userName: user.userName,
        email: user.email,
        avatarUrl: user.avatarUrl 
      },
      token: token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});


// Middleware do weryfikacji tokena
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.id;
    next();
  });
};

app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.findAll({
      include: [
        { model: Rating, as: 'ratings', attributes: ['value'] },
        { model: User, attributes: ['userName'] },
      ],
    });

    const moviesWithRatings = movies.map((movie) => {
      const ratings = movie.ratings.map((r) => r.value);
      const averageRating = ratings.length ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length : null;
      return { ...movie.toJSON(), averageRating };
    });

    res.json(moviesWithRatings);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).send('Could not fetch movies');
  }
});

app.get('/api/movies/:id', async (req, res) => {
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

    // Znajdź ocenę użytkownika
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

app.post('/api/movies/:id/rate', verifyToken, async (req, res) => {
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

app.get('/api/users/ratings', verifyToken, async (req, res) => {
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

app.post('/api/movies/:id/comments', verifyToken, async (req, res) => {
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

app.get('/api/movies/:id/comments', async (req, res) => {
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
      order: [['createdAt', 'DESC']],
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'An error occurred while fetching comments' });
  }
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'images/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// dodawanie avatara
app.post('/api/users/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // jeśli użytkownik ma już avatar, usuń go
    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `images/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading avatar' });
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

app.post('/api/movies', uploadMovie.single('image'), verifyToken, async (req, res) => {
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

app.use('/images', express.static('images'));

app.get('/api/movies/:id/watched', verifyToken, async (req, res) => {
  const movieId = req.params.id;
  const userId = req.userId; // Pobranie ID użytkownika z tokenu

  try {
    // Sprawdzanie, czy film znajduje się w tabeli WatchedMovie
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

app.post('/api/movies/:id/watched', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Sprawdzenie, czy film już został oznaczony jako obejrzany przez użytkownika
    const existingWatchedMovie = await WatchedMovie.findOne({
      where: {
        movieId: id,
        userId,
      },
    });

    if (existingWatchedMovie) {
      return res.status(400).json({ message: 'Movie already marked as watched' });
    }

    // Dodanie nowego wpisu do tabeli WatchedMovie
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

app.delete('/api/movies/:id/watched', verifyToken, async (req, res) => {
  const movieId = req.params.id;
  const userId = req.userId; // Pobranie ID użytkownika z tokenu

  try {
    // Usuwanie rekordu z tabeli WatchedMovie
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

// Uruchomienie serwera i synchronizacja bazy
const startServer = async () => {
  try {
    await sequelize.sync({ force: false });  // Synchronizowanie bazy danych
    console.log('Database synchronized');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error during synchronization:', error);
  }
};

startServer();