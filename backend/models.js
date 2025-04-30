// backend/models.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema (for Sign-up and Sign-in)
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Profile Schema
const profileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  current_metrics: {
    height: { type: Number, required: true }, // in cm
    weight: { type: Number, required: true }, // in kg
    bmi: { type: Number, required: true },
    heart_rate: { type: Number },
    sleep_hours: { type: Number }
  },
  goal_metrics: {
    weight_goal: { type: Number },
    bmi_goal: { type: Number },
    fitness_level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    workout_goal: { type: String, enum: ['gain muscle', 'lose weight', 'maintain weight'] },
    sleep_goal: { type: String }
  },
  preferences: {
    workout_preferences: [String], // e.g. ['strength', 'cardio']
    dietary_preferences: [String]  // e.g. ['vegan', 'keto']
  },
  progress: {
    total_steps: { type: Number },
    completed_workouts: { type: Number },
    calories_burned: { type: Number }
  },
  birthday: { type: Date },
  motivational_message: { type: String },
  last_updated: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', profileSchema);

// Workout Schema
const workoutSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workout_plan: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    exercises: [{
      name: { type: String, required: true },
      sets: { type: Number, required: true },
      reps: { type: Number, required: true }
    }]
  }],
  progress: {
    completed_sets: { type: Number },
    feedback_notes: { type: String }
  },
  date_created: { type: Date, default: Date.now }
});

const Workout = mongoose.model('Workout', workoutSchema);

// Diet Schema
const dietSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meal_plan: [{
    meal_type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    foods: [{ name: { type: String }, calories: { type: Number } }]
  }],
  total_calories: { type: Number, required: true },
  progress: {
    calories_consumed: { type: Number },
    meal_notes: { type: String }
  },
  diet_type: { type: String, enum: ['weight gain', 'weight loss', 'maintenance'] },
  last_updated: { type: Date, default: Date.now }
});

const Diet = mongoose.model('Diet', dietSchema);

// Cardio Schema
const cardioSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  daily_steps: { type: Number, default: 0 },
  cardio_goals: {
    goal_miles: { type: Number, required: true },
    type_of_activity: { type: String, enum: ['walking', 'jogging', 'running'], required: true }
  },
  heart_points: { type: Number, default: 0 },
  date_created: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
});

const Cardio = mongoose.model('Cardio', cardioSchema);

// Sleep Schema
const sleepSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sleep_data: [{
    date: { type: Date, required: true },
    hours_slept: { type: Number, required: true },
    quality: { type: String, enum: ['poor', 'average', 'good', 'excellent'] },
    notes: { type: String }
  }],
  sleep_goals: {
    goal_hours: { type: Number, required: true }
  },
  sleep_report: {
    avg_hours: { type: Number },
    improvement_notes: { type: String }
  },
  last_updated: { type: Date, default: Date.now }
});

const Sleep = mongoose.model('Sleep', sleepSchema);

module.exports = { User, Profile, Workout, Diet, Cardio, Sleep };
