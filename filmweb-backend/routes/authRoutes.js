import express from 'express';
import { Sequelize, Op } from 'sequelize';
import { User, Movie, Comment, Rating, WatchedMovie } from '../models.js';  
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken'; 
const router = express.Router();

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
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

    // generowanie tokena
    const token = jwt.sign(
      { id: user.id, userName: user.userName, email: user.email }, // dane, które będą przechowywane w tokenie
      process.env.JWT_SECRET, // secret jest używane do podpisania tokenu, co zapewnia jego integralność i umożliwia późniejsze weryfikowanie, że token nie został zmieniony
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
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

export default router;