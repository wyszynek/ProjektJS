import express from 'express';
import cors from 'cors';
import { Sequelize, Op } from 'sequelize';
import { User, Movie, Comment, Rating } from './models.js'; 
import sequelize from './db.js';  
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; 

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
  const { identifier, password } = req.body; // identifier to może być email lub userName

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  try {
    const user = await User.findOne({ where: { [Op.or]: [{ email: identifier }, { userName: identifier }] } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or username' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generowanie tokena JWT
    const token = jwt.sign(
      { id: user.id, userName: user.userName, email: user.email }, // Dane, które chcemy zawrzeć w tokenie
      process.env.JWT_SECRET, // Klucz sekretu
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: { userName: user.userName, email: user.email },
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

app.post('/api/movies', verifyToken, async (req, res) => {
  const { title, director, description, genre, releaseDate } = req.body;

  if (!title || !description || !genre || !releaseDate || !director) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const movie = await Movie.create({
      title,
      director,
      description,
      genre,
      releaseDate,
      userId: req.userId, 
    });

    res.status(201).json({ message: 'Movie added successfully', movie });
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'An error occurred while adding the movie' });
  }
});

app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.findAll({ include: User });
    res.json(movies);
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.status(500).send("Could not fetch plans");
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
