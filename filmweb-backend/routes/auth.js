const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// lepiej zamienic na bazke jakas
const users = [];

router.post('/register', [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('userName').isAlphanumeric().withMessage('User name must be alphanumeric').notEmpty().withMessage('User name is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('birthDate').isDate().withMessage('Enter a valid date (YYYY-MM-DD)')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email, password, userName, firstName, lastName, birthDate } = req.body;
  
    const existingUser = users.find(user => user.email === email || user.userName === userName);
    if (existingUser) {
      return res.status(400).json({ message: 'Email or user name already exists' });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    users.push({ email, password: hashedPassword, userName, firstName, lastName, birthDate });
    res.status(201).json({ message: 'User registered successfully' });
});

module.exports = router;

router.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier może być userName lub email
    const user = users.find(user => user.email === identifier || user.userName === identifier);
  
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or user name' });
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful', user: { userName: user.userName, email: user.email } });
});