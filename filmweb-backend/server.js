import express from 'express';
import cors from 'cors';
import { Sequelize, Op } from 'sequelize';
import { User, Movie, Comment, Rating } from './models.js'; 
import sequelize from './db.js';  
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

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
import jwt from 'jsonwebtoken'; 

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
