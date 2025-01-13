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

import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import usersRoutes from './routes/usersRoutes.js';

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

app.use('/api/auth', authRoutes);

app.use('/api/movies', movieRoutes);

app.use('/api/users', usersRoutes);

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