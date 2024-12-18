const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('/api/auth/users', (req, res) => {
    return res.status(200).json(users);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
