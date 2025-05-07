const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
console.log('Mongo URI:', process.env.MONGO_URI);

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

// Corrected path to workout model
const Workout = require('./models/workout');

// Import routes with corrected paths
const signupRoutes = require('./routes/auth/signup');
const signinRoutes = require('./routes/auth/signin');
const profileRoutes = require('./routes/profile/profile');
const workoutRoutes = require('./routes/workouts/workouts');
const cardioRoutes = require('./routes/cardio/cardio');
const dietRoutes = require('./routes/diet/diet');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection (removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth/signup', signupRoutes);
app.use('/api/auth/signin', signinRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/cardio', cardioRoutes);
app.use('/api/diet', dietRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Serve HTML pages
const pages = {
  '/': 'sign-in.html',
  '/sign-up': 'sign-up.html',
  '/dashboard': 'dashboard.html',
  '/profilesetup': 'profilesetup.html',
  '/diet_plan': 'diet_plan.html',
  '/mealplan': 'mealplan.html',
  '/todayworkout': 'todaysworkout.html',
  '/updategoals': 'updategoals.html',
  '/workouts': 'workouts.html',
  '/cardio': 'cardio.html',
  '/logout': 'logout.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', file));
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});