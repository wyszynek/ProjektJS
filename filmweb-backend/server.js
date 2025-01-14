import express from 'express'; //do zarządzania żądaniami/odp HTTP
import cors from 'cors'; //umożliwia dzielenie się zasobami między różnymi domenami
import { User, Movie, Comment, Rating, WatchedMovie } from './models.js'; 
import sequelize from './db.js'; //definiowanie modeli do bazy danych
import dotenv from 'dotenv'; //ładowanie zmiennych z .env do tokena
import jwt from 'jsonwebtoken'; //autoryzacja użytkowników
import multer from 'multer'; //zapis przesłanych plików na serwerze (avatary i zdj filmów)
import path from 'path'; // manipulowanie ścieżkami w sposób niezależny od systemu operacyjnego
import fs from 'fs'; //odczytywanie, zapisywanie, usuwanie plików i folderów (znajdywanie zdjęć)

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
    cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
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
      return cb(null, true);
    } else {
      cb('Error: Images only!');
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

    // Delete old avatar if exists
    if (user.avatarUrl) {
      const oldPath = path.join(process.cwd(), user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `images/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });

    res.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
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