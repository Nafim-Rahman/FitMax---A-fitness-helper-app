const express = require('express');
const dotenv = require('dotenv');  // Moved above to load before accessing env vars
dotenv.config({ path: 'D:/School & Uni/Uni Study Stuff/9th Semester (Spring 25)/CSE471 - System Analysis and Design/Lab/Project/Module 4 monday/module 2 sign in sign up/backend/.env' });  // Load env variables early
console.log('Mongo URI:', process.env.MONGO_URI);  // Correctly logs the loaded URI

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');  // Added for CORS support

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
// app.use(bodyParser.json());  // Removed as express.json() handles this
app.use(cors()); // Enable CORS
app.use(express.json());  // Ensure JSON body parsing is enabled

// Serve static files from the "frontend" directory
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));
console.log(process.env.MONGO_URI);  // This should print your MongoDB URI

// Define API routes
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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'sign-in.html')); // Default page (Sign In)
});

app.get('/sign-up', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'sign-up.html')); // Sign Up page
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'dashboard.html'));
   // Dashboard page (add more routes as needed)
});

app.get('/profilesetup', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'profilesetup.html'));
  // Profile Setup page
  });

app.get('/diet_plan', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'diet_plan.html'));
  // Diet Plan page
  });

app.get('/mealplan', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'mealplan.html'));
  // Meal Plan page
  });

app.get('/todayworkout', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'todaysworkout.html'));
  // Today's Workout page
});

app.get('/updategoals', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'updategoals.html'));
  // Update Goals page
});

app.get('/workouts', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'workouts.html'));
  // Workouts page
});

app.get('/cardio', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages', 'cardio.html'));
  // Cardio page
});

// Start server
const port = process.env.PORT || 5000;  // Default to port 5000 if not specified
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
