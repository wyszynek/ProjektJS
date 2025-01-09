import sequelize from './db.js';
import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  birthDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const Movie = sequelize.define('Movie', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  director: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  releaseDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
});

export const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Movie,
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
});

export const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Movie,
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
});

export const WatchedMovie = sequelize.define('WatchedMovie', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Movie,
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

Movie.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Movie.hasMany(Comment, { as: 'comments', foreignKey: 'movieId', onDelete: 'CASCADE' });
Movie.hasMany(Rating, { as: 'ratings', foreignKey: 'movieId', onDelete: 'CASCADE' });

Comment.belongsTo(Movie, { foreignKey: 'movieId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

Rating.belongsTo(Movie, { foreignKey: 'movieId', onDelete: 'CASCADE' });
Rating.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

User.hasMany(WatchedMovie, { foreignKey: 'userId' });
Movie.hasMany(WatchedMovie, { foreignKey: 'movieId' });

WatchedMovie.belongsTo(Movie, { foreignKey: 'movieId' });

// Synchronizacja bazy danych
await sequelize
  .sync({ alter: true })
  .then(() => console.log('Database synchronized'))
  .catch((err) => console.error('Database synchronization error:', err));
