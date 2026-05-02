const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Auth Service: Connected to MongoDB'))
  .catch(err => console.error('Auth Service: MongoDB connection error:', err));

// Routes
app.use('/', authRoutes);

// Error Handling
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
