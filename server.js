const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: 'C:/Users/HP User/Downloads/FitMax---A-fitness-helper-app(2)/backend/.env' });

const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

// Import routes
const signupRoutes = require('./routes/auth/signup');
const signinRoutes = require('./routes/auth/signin');
const profileRoutes = require('./routes/profile/profile');
const workoutRoutes = require('./routes/workouts/workouts');
const cardioRoutes = require('./routes/cardio/cardio');
const dietRoutes = require('./routes/diet/diet');

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth/signup', signupRoutes);
app.use('/api/auth/signin', signinRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/cardio', cardioRoutes);
app.use('/api/diet', dietRoutes);

// HTML Routes
const servePage = (page) => (req, res) => 
  res.sendFile(path.join(__dirname, `../frontend/pages/${page}.html`));

app.get('/', servePage('sign-in'));
app.get('/sign-up', servePage('sign-up'));
app.get('/dashboard', servePage('dashboard'));
app.get('/profilesetup', servePage('profilesetup'));
app.get('/diet_plan', servePage('diet_plan'));
app.get('/mealplan', servePage('mealplan'));
app.get('/todayworkout', servePage('todaysworkout'));
app.get('/updategoals', servePage('updategoals'));
app.get('/workouts', servePage('workouts'));
app.get('/cardio', servePage('cardio'));
app.get('/logout',servePage('logout'))
// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});