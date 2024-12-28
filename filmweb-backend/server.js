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

// Endpoint do rejestracji użytkownika
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

// Endpoint do logowania użytkownika
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier to może być email lub userName

  // Sprawdzamy, czy dane są przekazane
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  try {
    // Szukamy użytkownika po emailu lub nazwie użytkownika
    const user = await User.findOne({ where: { [Op.or]: [{ email: identifier }, { userName: identifier }] } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or username' });
    }

    // Sprawdzamy, czy hasło jest poprawne
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generowanie tokena JWT
    const token = jwt.sign(
      { id: user.id, userName: user.userName, email: user.email }, // Dane, które chcemy zawrzeć w tokenie
      process.env.JWT_SECRET, // Klucz sekretu (upewnij się, że jest ustawiony w pliku .env)
      { expiresIn: '1h' } // Ważność tokena (1 godzina)
    );

    // Logowanie udane, zwracamy token
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
  const token = req.headers['authorization']?.split(' ')[1]; // Token w nagłówku Authorization (Bearer token)

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.id; // Zapisujemy ID użytkownika w req.userId
    next();
  });
};

app.post('/api/movies', verifyToken, async (req, res) => {
  const { title, description, genre, releaseDate } = req.body;

  // Sprawdzamy, czy wszystkie dane zostały przesłane
  if (!title || !description || !genre || !releaseDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Tworzymy nowy film i przypisujemy go do użytkownika
    const movie = await Movie.create({
      title,
      description,
      genre,
      releaseDate,
      userId: req.userId, // Przypisujemy ID użytkownika (pobierane z tokena)
    });

    res.status(201).json({ message: 'Movie added successfully', movie });
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'An error occurred while adding the movie' });
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
